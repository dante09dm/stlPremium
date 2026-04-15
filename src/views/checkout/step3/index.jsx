import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { displayMoney } from '@/helpers/utils';
import { StepTracker } from '../components';
import { Boundary } from '@/components/common';
import { CHECKOUT_STEP_2 } from '@/constants/routes';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:5002/bodnes-7e5df/us-central1/createPreference'
  : 'https://us-central1-bodnes-7e5df.cloudfunctions.net/createPreference';

const sendToWhatsApp = (form, subtotal, basket) => {
  const productDetails = basket.map((product) =>
    `- ${product.name}: ${displayMoney(product.price)} x ${product.quantity}`
  ).join('\n');

  const message = `Detalles de la orden:
  \nNombre: ${form.fullname}
  \nEmail: ${form.email}
  \nNúmero de teléfono: ${form.mobile?.dialCode} ${form.mobile?.value}
  \nProductos:\n${productDetails}
  \nTotal: ${displayMoney(subtotal)}`;

  const phoneNumber = "+542323641481";
  window.open(
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
    '_blank'
  );
};

const Payment = () => {
  const history = useHistory();

  const { basket, subtotal, shipping } = useSelector((state) => ({
    basket: state.basket,
    subtotal: state.checkout.subtotal,
    shipping: state.checkout.shipping
  }));

  const [preferenceId, setPreferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatedSubtotal = basket.reduce(
    (total, product) => total + product.price * product.quantity, 0
  );
  const safeSubtotal = subtotal !== undefined ? subtotal : calculatedSubtotal;

  useEffect(() => {
    initMercadoPago('TEST-a0581f59-29de-42d3-8cee-cf07490c9989', { locale: 'es-AR' });
  }, []);

  const handleMercadoPagoPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!basket || basket.length === 0) throw new Error('El carrito está vacío');

      const items = basket.map(product => ({
        title: String(product.name || 'Producto'),
        unit_price: parseFloat(Number(product.price || 0).toFixed(2)),
        quantity: Number(product.quantity || 1),
        description: `Modelo 3D STL — ${product.category || ''}`,
      }));

      const payloadData = {
        items,
        // ── IDs de productos para registrar acceso a STL post-compra ──
        productIds: basket.map(product => product.id),
        payer: {
          email: shipping?.email || 'client@example.com',
          name: shipping?.fullname?.split(' ')[0] || '',
          surname: shipping?.fullname?.split(' ')[1] || '',
          phone: {
            area_code: shipping?.mobile?.dialCode?.replace('+', '') || '',
            number: shipping?.mobile?.value || '',
          }
        }
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(payloadData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Error al crear la preferencia');

      setPreferenceId(data.id);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Boundary>
      <div className="checkout">
        <StepTracker current={3} />
        <div className="checkout-step-3">
          <h3 className="text-center">Método de Pago</h3>

          {error && (
            <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
              {error}
            </div>
          )}

          <div className="payment-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {preferenceId ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Wallet
                  initialization={{ preferenceId }}
                  customization={{ texts: { valueProp: 'security_safety' } }}
                />
              </div>
            ) : (
              <button
                className="button button-icon"
                onClick={handleMercadoPagoPayment}
                disabled={isLoading}
                style={{ backgroundColor: '#009EE3', color: 'white' }}
              >
                {isLoading ? 'Procesando...' : 'Pagar con Mercado Pago'}
              </button>
            )}

            <button
              className="button"
              style={{ backgroundColor: '#25D366', color: 'white' }}
              onClick={() => sendToWhatsApp(shipping, safeSubtotal, basket)}
              disabled={!shipping?.fullname || !shipping?.mobile?.value}
            >
              Enviar detalles por WhatsApp
            </button>
          </div>

          <div className="checkout-shipping-action" style={{ marginTop: '2rem' }}>
            <button
              className="button button-muted"
              onClick={() => history.push(CHECKOUT_STEP_2)}
              type="button"
            >
              <ArrowLeftOutlined /> &nbsp; Volver
            </button>
          </div>
        </div>
      </div>
    </Boundary>
  );
};

export default Payment;
