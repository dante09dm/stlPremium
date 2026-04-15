import { LoadingOutlined } from '@ant-design/icons';
import { useDocumentTitle, useProduct, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { editProduct } from '@/redux/actions/productActions';

const ProductForm = lazy(() => import('../components/ProductForm'));

const Loader = () => (
  <div className="loader" style={{ minHeight: '80vh' }}>
    <h6>Cargando...</h6>
    <br />
    <LoadingOutlined />
  </div>
);

const EditProduct = ({ match }) => {
  useDocumentTitle('Editar producto');
  useScrollTop();

  const { product, error, isLoading } = useProduct(match.params.id);
  const dispatch = useDispatch();

  const onSubmitForm = (updates) => {
    dispatch(editProduct(product.id, updates));
  };

  if (error) return <Redirect to="/dashboard/products" />;
  if (isLoading || !product) return <Loader />;

  return (
    <div className="product-form-container">
      <h2>Editar Producto</h2>
      <Suspense fallback={<Loader />}>
        <ProductForm
          isLoading={false}
          onSubmit={onSubmitForm}
          product={product}
        />
      </Suspense>
    </div>
  );
};

EditProduct.propTypes = {
  match: PropType.shape({
    params: PropType.shape({
      id: PropType.string
    })
  }).isRequired
};

export default withRouter(EditProduct);


