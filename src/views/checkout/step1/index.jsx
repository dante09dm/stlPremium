import { ArrowRightOutlined, ShopOutlined, LockOutlined } from '@ant-design/icons';
import { BasketItem } from '@/components/basket';
import { CHECKOUT_STEP_2, SIGNIN } from '@/constants/routes';
import { displayMoney } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';

const OrderSummary = ({ basket, subtotal, isAuth }) => {
  useDocumentTitle('Check out paso 1 | STL Market');
  useScrollTop();
  const dispatch = useDispatch();
  const history = useHistory();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const onClickPrevious = () => history.push('/');

  const onClickNext = () => {
    if (basket.length === 0) return;

    if (!isAuth) {
      // Mostrar prompt en vez de redirigir de golpe
      setShowLoginPrompt(true);
      return;
    }

    history.push(CHECKOUT_STEP_2);
  };

  const goToLogin = () => {
    // Guardar destino para redirigir después del login
    history.push(SIGNIN, { from: CHECKOUT_STEP_2 });
  };

  return (
    <div className="checkout">
      <StepTracker current={1} />
      <div className="checkout-step-1">
        <h3 className="text-center">Resumen de pedido</h3>
        <span className="d-block text-center">Revisá los artículos en tu carrito.</span>
        <br />
        <div className="checkout-items">
          {basket.map((product) => (
            <BasketItem
              basket={basket}
              dispatch={dispatch}
              key={product.id}
              product={product}
            />
          ))}
        </div>
        <br />
        <div className="basket-total text-right">
          <p className="basket-total-title">Subtotal:</p>
          <h2 className="basket-total-amount">{displayMoney(subtotal)}</h2>
        </div>
        <br />

        {/* Aviso de login requerido */}
        {showLoginPrompt && !isAuth && (
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#1e0608',
            borderRadius: '10px',
            border: '1px solid rgba(255,36,66,0.2)',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <LockOutlined style={{ fontSize: '1.75rem', color: '#ff2442', display: 'block', marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: '700', color: '#1e40af', marginBottom: '0.25rem' }}>
              Necesitás una cuenta para completar la compra
            </p>
            <p style={{ fontSize: '0.85rem', color: '#ff2442', marginBottom: '1rem' }}>
              Así tus archivos STL quedan guardados y podés descargarlos cuando quieras.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="button button-small"
                onClick={goToLogin}
                type="button"
              >
                Iniciar sesión
              </button>
              <button
                className="button button-small button-border"
                onClick={() => history.push('/signup', { from: CHECKOUT_STEP_2 })}
                type="button"
              >
                Crear cuenta gratis
              </button>
            </div>
          </div>
        )}

        <div className="checkout-shipping-action">
          <button
            className="button button-muted"
            onClick={onClickPrevious}
            type="button"
          >
            <ShopOutlined />
            &nbsp;
            Seguir viendo productos
          </button>
          <button
            className="button"
            onClick={onClickNext}
            type="button"
          >
            {isAuth ? (
              <>SIGUIENTE PASO &nbsp;<ArrowRightOutlined /></>
            ) : (
              <><LockOutlined /> &nbsp;CONTINUAR</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

OrderSummary.propTypes = {
  basket: PropType.arrayOf(PropType.object).isRequired,
  subtotal: PropType.number.isRequired,
  isAuth: PropType.bool
};

export default withCheckout(OrderSummary);
