import { CloseCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { CHECKOUT_STEP_1 } from '@/constants/routes';

const CheckoutFailure = () => {
  const history = useHistory();

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', padding: '2rem'
    }}>
      <CloseCircleOutlined style={{ fontSize: '3.5rem', color: '#ff2442' }} />
      <h3 style={{ margin: 0, color: '#f1f5f9' }}>El pago no pudo procesarse</h3>
      <p style={{ margin: 0, color: '#64748b', maxWidth: 360 }}>
        Hubo un problema con tu pago. Podés intentarlo de nuevo o usar otro método.
      </p>
      <button className="button" onClick={() => history.push(CHECKOUT_STEP_1)}>
        Volver al carrito
      </button>
    </div>
  );
};

export default CheckoutFailure;
