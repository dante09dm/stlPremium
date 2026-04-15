/**
 * Aplica las reglas CORS al bucket de Firebase Storage.
 * Requiere: npm install @google-cloud/storage
 * Uso: node set-cors.js
 *
 * Necesitás un Service Account JSON de Firebase:
 * Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

// ← Poné acá la ruta a tu service account JSON
const SERVICE_ACCOUNT_PATH = './serviceAccount.json';

const storage = new Storage({
  keyFilename: path.resolve(SERVICE_ACCOUNT_PATH),
});

const BUCKET = 'stlpremium99.firebasestorage.app';

const corsConfig = [
  {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://stlpremium.com',
      'https://www.stlpremium.com',
    ],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Content-Length',
      'Content-Disposition',
      'Authorization',
      'x-goog-resumable',
    ],
  },
];

async function setCors() {
  await storage.bucket(BUCKET).setCorsConfiguration(corsConfig);
  console.log(`✅ CORS configurado en gs://${BUCKET}`);
}

setCors().catch((err) => {
  console.error('❌ Error:', err.message);
});
