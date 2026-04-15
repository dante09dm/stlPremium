import { HOME } from '@/constants/routes';
import { calculateTotal } from '@/helpers/utils';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

const withCheckout = (Component) =>
  withRouter((props) => {
    const dispatch = useDispatch();
    const reduxBasket = useSelector((state) => state.basket || []);
    const auth = useSelector((state) => state.auth);
    const isAuth = !!auth?.id && !!auth?.role;

    const [localBasket, setLocalBasket] = useState([]);
    const [initialized, setInitialized] = useState(false);

    // Sync local basket if user is not authenticated
    useEffect(() => {
      if (isAuth) {
        setLocalBasket([]); // No se usa cuando hay login
        setInitialized(true);
      } else {
        try {
          const storedBasket = JSON.parse(localStorage.getItem('basket')) || [];
          setLocalBasket(Array.isArray(storedBasket) ? storedBasket : []);
        } catch (error) {
          console.error('Error al recuperar el carrito del localStorage:', error);
          setLocalBasket([]);
        } finally {
          setInitialized(true);
        }
      }
    }, [isAuth, reduxBasket]);

    // Funciones para manejo sin login
    const updateLocalBasket = (newBasket) => {
      setLocalBasket(newBasket);
      localStorage.setItem('basket', JSON.stringify(newBasket));
    };

    const handleIncreaseQuantity = (productId) => {
      if (isAuth) {
        dispatch({ type: 'INCREMENT_QUANTITY', payload: productId });
      } else {
        const updated = localBasket.map((p) =>
          p.id === productId ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
        updateLocalBasket(updated);
      }
    };

    const handleDecreaseQuantity = (productId) => {
      if (isAuth) {
        dispatch({ type: 'DECREMENT_QUANTITY', payload: productId });
      } else {
        const updated = localBasket.map((p) =>
          p.id === productId && p.quantity > 1
            ? { ...p, quantity: p.quantity - 1 }
            : p
        );
        updateLocalBasket(updated);
      }
    };

    const handleRemoveFromBasket = (productId) => {
      if (isAuth) {
        dispatch({ type: 'REMOVE_FROM_BASKET', payload: productId });
      } else {
        const updated = localBasket.filter((p) => p.id !== productId);
        updateLocalBasket(updated);
      }
    };

    const currentBasket = isAuth ? reduxBasket : localBasket;

    if (!initialized) return null;

    if (!Array.isArray(currentBasket) || currentBasket.length === 0) {
      return <Redirect to={HOME} />;
    }

    const subtotal = Number(
      calculateTotal(
        currentBasket.map((p) => {
          const price = Number(p.price) || 0;
          const qty = Number(p.quantity) || 0;
          return price * qty;
        })
      )
    );

    return (
      <Component
        {...props}
        basket={currentBasket}
        subtotal={isNaN(subtotal) ? 0 : subtotal}
        isAuth={isAuth}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRemoveFromBasket={handleRemoveFromBasket}
      />
    );
  });

export default withCheckout;




