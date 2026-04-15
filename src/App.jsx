/* eslint-disable react/forbid-prop-types */
import { Preloader } from '@/components/common';
import PropType from 'prop-types';
import React, { StrictMode, useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppRouter from '@/routers/AppRouter';

// Componente que sincroniza Redux con localStorage
const BasketSync = () => {
  const basket = useSelector((state) => state.basket);

  useEffect(() => {
    localStorage.setItem('basket', JSON.stringify(basket));
  }, [basket]);

  return null;
};

const App = ({ store, persistor }) => (
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<Preloader />} persistor={persistor}>
        <BasketSync />
        <AppRouter />
      </PersistGate>
    </Provider>
  </StrictMode>
);

App.propTypes = {
  store: PropType.any.isRequired,
  persistor: PropType.any.isRequired
};

export default App;

