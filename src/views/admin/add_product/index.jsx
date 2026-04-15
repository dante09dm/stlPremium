import React, { lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { addProduct } from '@/redux/actions/productActions';

const ProductForm = lazy(() => import('../components/ProductForm'));

const AddProduct = () => {
  const isLoading = useSelector((state) => state.app.loading);
  const dispatch = useDispatch();

  const onSubmit = (product) => {
    dispatch(addProduct(product));
  };

  return (
    <div className="product-form-container">
      <h2>Agregar Producto</h2>
      <Suspense fallback={<div>Cargando formulario...</div>}>
        <ProductForm
          isLoading={isLoading}
          onSubmit={onSubmit}
          product={null}
        />
      </Suspense>
    </div>
  );
};

export default withRouter(AddProduct);


