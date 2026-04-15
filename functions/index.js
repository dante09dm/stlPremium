import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { config } from 'firebase-functions';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { isIP } from 'net';
import nodemailer from 'nodemailer';

// Initialize Firebase Admin SDK
const adminApp = initializeApp();
const db = getFirestore(adminApp);

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction
  ? 'https://www.bodnes.com'
  : 'http://localhost:3000';

// Rate limiter configuration (10 requests per minute per IP)
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

// MercadoPago configuration
let mercadopagoClient;
try {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    || config().mercadopago?.access_token
    || (isProduction ? null : 'TEST-a0581f59-29de-42d3-8cee-cf07490c9989');

  if (!accessToken) throw new Error('MercadoPago access token not configured');

  mercadopagoClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000, idempotencyKey: true }
  });
  console.log('MercadoPago initialized');
} catch (error) {
  console.error('MercadoPago init error:', error.message);
  throw error;
}

// CORS configuration
const corsHandler = cors({
  origin: [
    'http://localhost:3000',
    'https://bodnes-7e5df.web.app',
    'https://www.bodnes.com',
    'https://bodnes.com'
  ],
  methods: ['POST', 'OPTIONS'],
  credentials: true
});

// Valid IP ranges for MercadoPago
const mercadopagoIPs = [
  '179.32.192.0/24',
  '190.217.32.0/24',
  '191.97.16.0/24',
  '186.33.128.0/24',
  '186.33.129.0/24',
  '186.33.130.0/24',
  '186.33.131.0/24'
];

const isIPInRange = (ip, range) => {
  const [rangeIp, mask] = range.split('/');
  const maskBits = parseInt(mask, 10);
  const ipParts = ip.split('.').map(Number);
  const rangeParts = rangeIp.split('.').map(Number);

  const maskBytes = [
    maskBits >= 8 ? 255 : 256 - (1 << (8 - maskBits % 8)),
    maskBits >= 16 ? 255 : (maskBits > 8 ? 256 - (1 << (16 - maskBits % 16)) : 0),
    maskBits >= 24 ? 255 : (maskBits > 16 ? 256 - (1 << (24 - maskBits % 24)) : 0),
    maskBits > 24 ? 256 - (1 << (32 - maskBits % 32)) : 0
  ];

  for (let i = 0; i < 4; i++) {
    if ((ipParts[i] & maskBytes[i]) !== (rangeParts[i] & maskBytes[i])) return false;
  }
  return true;
};

const validateIP = (req, res, next) => {
  if (!isProduction || req.originalUrl.includes('createPreference')) return next();

  let clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  if (clientIp === '::1') clientIp = '127.0.0.1';
  else if (clientIp.includes(':')) clientIp = clientIp.split(':').pop();

  if (!isIP(clientIp)) return res.status(403).json({ error: "Invalid IP format" });
  if (!mercadopagoIPs.some(range => isIPInRange(clientIp, range))) {
    return res.status(403).json({ error: "Unauthorized IP" });
  }
  next();
};

const validateRequest = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: "Unsupported Media Type" });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body is empty" });
  }
  next();
};

const rateLimitMiddleware = async (req, res, next) => {
  if (!isProduction) return next();
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
    await rateLimiter.consume(clientIp.split(':')[0]);
    next();
  } catch {
    res.status(429).json({ error: "Too many requests" });
  }
};

// ─── createPreference ──────────────────────────────────────────────────────────
async function processPayment(req, res) {
  try {
    if (!mercadopagoClient) throw new Error('Payment service unavailable');

    const { items, payer } = req.body;

    if (!items?.length || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be a non-empty array" });
    }
    if (!payer?.email || !/^\S+@\S+\.\S+$/.test(payer.email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const formattedItems = items.map(item => {
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price <= 0) throw new Error(`Invalid price for item: ${item.title}`);
      return {
        title: String(item.title || 'Item').substring(0, 256),
        unit_price: price,
        quantity: parseInt(item.quantity) || 1,
        currency_id: 'ARS',
        ...(item.description && { description: String(item.description).substring(0, 256) })
      };
    });

    const preference = new Preference(mercadopagoClient);
    const mpResponse = await preference.create({
      body: {
        items: formattedItems,
        payer: {
          email: String(payer.email),
          ...(payer.name && { name: String(payer.name).substring(0, 50) }),
          ...(payer.surname && { surname: String(payer.surname).substring(0, 50) }),
          ...(payer.phone && {
            phone: {
              area_code: String(payer.phone.area_code || '').substring(0, 10),
              number: String(payer.phone.number || '').substring(0, 20)
            }
          })
        },
        // Guardamos el email del comprador en metadata para recuperarlo en el webhook
        metadata: {
          payer_email: payer.email,
          payer_name: `${payer.name || ''} ${payer.surname || ''}`.trim()
        },
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`
        },
        auto_return: "approved",
        binary_mode: true,
        notification_url: isProduction
          ? "https://us-central1-bodnes-7e5df.cloudfunctions.net/mercadopagoWebhook"
          : undefined
      }
    });

    // Guardar preferencia pendiente en Firestore para recuperarla en el webhook
    await db.collection('pending_payments').doc(mpResponse.id).set({
      preferenceId: mpResponse.id,
      payerEmail: payer.email,
      payerName: `${payer.name || ''} ${payer.surname || ''}`.trim(),
      items: formattedItems,
      // Guardamos también los productIds para poder dar acceso a los STL
      productIds: req.body.productIds || [],
      createdAt: new Date().getTime(),
      status: 'pending'
    });

    // Email de notificación
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || config().email?.user,
          pass: process.env.EMAIL_PASS || config().email?.pass,
        },
      });

      await transporter.sendMail({
        from: `"Bodnes Bot" <${process.env.EMAIL_USER || config().email?.user}>`,
        to: 'Bodnescontacto@gmail.com',
        subject: '🛒 Nuevo intento de compra en Bodnes',
        html: `
          <h2>Nuevo intento de compra</h2>
          <p><strong>Nombre:</strong> ${payer.name || ''} ${payer.surname || ''}</p>
          <p><strong>Email:</strong> ${payer.email}</p>
          <h3>Items:</h3>
          <ul>${formattedItems.map(i => `<li>${i.title} — ${i.quantity} x $${i.unit_price}</li>`).join('')}</ul>
          <p><strong>Enlace de pago:</strong> <a href="${mpResponse.init_point}">${mpResponse.init_point}</a></p>
        `
      });
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
    }

    res.status(200).json({
      success: true,
      id: mpResponse.id,
      init_point: mpResponse.init_point,
      sandbox_init_point: mpResponse.sandbox_init_point
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Payment processing failed",
      message: error.message
    });
  }
}

export const createPreference = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60, minInstances: 0, maxInstances: 3 },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        await rateLimitMiddleware(req, res, () => {});
        validateRequest(req, res, () => {});
        await processPayment(req, res);
      } catch (error) {
        res.status(500).json({ success: false, error: "Internal server error", message: error.message });
      }
    });
  }
);

// ─── mercadopagoWebhook ────────────────────────────────────────────────────────
async function processWebhook(req, res) {
  try {
    console.log('Webhook received:', req.body);

    const { type, data } = req.body;

    // MercadoPago manda type "payment" cuando se aprueba un pago
    if (type !== 'payment' || !data?.id) {
      return res.status(200).send('OK');
    }

    const paymentId = String(data.id);

    // Obtener detalles del pago desde MercadoPago
    const paymentClient = new Payment(mercadopagoClient);
    const paymentData = await paymentClient.get({ id: paymentId });

    console.log('Payment data:', {
      id: paymentData.id,
      status: paymentData.status,
      preferenceId: paymentData.preference_id,
      payerEmail: paymentData.payer?.email
    });

    // Solo procesar pagos aprobados
    if (paymentData.status !== 'approved') {
      console.log(`Payment ${paymentId} status: ${paymentData.status} — skipping`);
      return res.status(200).send('OK');
    }

    const preferenceId = paymentData.preference_id;
    const payerEmail = paymentData.payer?.email;

    // Recuperar datos de la preferencia pendiente
    const pendingRef = db.collection('pending_payments').doc(preferenceId);
    const pendingSnap = await pendingRef.get();

    let productIds = [];
    let payerName = '';
    let items = [];

    if (pendingSnap.exists) {
      const pendingData = pendingSnap.data();
      productIds = pendingData.productIds || [];
      payerName = pendingData.payerName || '';
      items = pendingData.items || [];
    }

    // Buscar usuario por email en Firestore
    const usersSnap = await db.collection('users').where('email', '==', payerEmail).limit(1).get();
    let userId = null;

    if (!usersSnap.empty) {
      userId = usersSnap.docs[0].id;
    }

    // Guardar la orden en Firestore
    const orderData = {
      paymentId,
      preferenceId,
      payerEmail,
      payerName,
      userId,           // null si compró sin registrarse
      productIds,       // IDs de los productos comprados
      items,            // detalle de items
      totalAmount: paymentData.transaction_amount,
      status: 'approved',
      createdAt: new Date().getTime(),
      // STL disponibles para descarga — se completan con los datos de los productos
      stlAccess: productIds  // el frontend busca los stlURLs con estos IDs
    };

    // Guardar en colección orders
    const orderRef = db.collection('orders').doc(paymentId);
    await orderRef.set(orderData);

    // Si el usuario está registrado, guardar referencia en su documento
    if (userId) {
      await db.collection('users').doc(userId).update({
        orders: [...(usersSnap.docs[0].data().orders || []), paymentId]
      });
    }

    // Marcar preferencia como completada
    if (pendingSnap.exists) {
      await pendingRef.update({ status: 'approved', paymentId });
    }

    console.log(`Order ${paymentId} saved successfully for ${payerEmail}`);

    // Email de confirmación al comprador
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || config().email?.user,
          pass: process.env.EMAIL_PASS || config().email?.pass,
        },
      });

      await transporter.sendMail({
        from: `"Bodnes" <${process.env.EMAIL_USER || config().email?.user}>`,
        to: payerEmail,
        subject: '✅ Tu compra fue aprobada — Bodnes',
        html: `
          <h2>¡Gracias por tu compra!</h2>
          <p>Tu pago fue aprobado. Podés descargar tus archivos STL desde tu cuenta en <a href="${baseUrl}/account">bodnes.com/account</a></p>
          <h3>Items comprados:</h3>
          <ul>${items.map(i => `<li>${i.title}</li>`).join('')}</ul>
          <p>Si tenés algún problema escribinos a Bodnescontacto@gmail.com</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Siempre responder 200 a MercadoPago para que no reintente
    res.status(200).send('OK');
  }
}

export const mercadopagoWebhook = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60, minInstances: 0, maxInstances: 3 },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        await rateLimitMiddleware(req, res, () => {});
        if (isProduction) validateIP(req, res, () => {});
        await processWebhook(req, res);
      } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(200).send('OK'); // siempre 200 a MercadoPago
      }
    });
  }
);