import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { ACCOUNT } from '@/constants/routes';

const CheckoutPending = () => {
  const history = useHistory();

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', padding: '2rem'
    }}>
      <ClockCircleOutlined style={{ fontSize: '3.5rem', color: '#f59e0b' }} />
      <h3 style={{ margin: 0, color: '#f1f5f9' }}>Pago pendiente</h3>
      <p style={{ margin: 0, color: '#64748b', maxWidth: 360 }}>
        Tu pago está siendo procesado. Una vez confirmado, los archivos aparecerán en tu perfil automáticamente.
      </p>
      <button className="button" onClick={() => history.push(ACCOUNT)}>
        <UserOutlined /> &nbsp; Ir a Mis archivos
      </button>
    </div>
  );
};

export default CheckoutPending;
