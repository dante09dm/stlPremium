import { EDIT_PRODUCT } from '@/constants/routes';
import { displayActionMessage, displayDate, displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React, { useRef } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useDispatch } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { removeProduct } from '@/redux/actions/productActions';

const ProductItem = ({ product }) => {
  const dispatch   = useDispatch();
  const history    = useHistory();
  const productRef = useRef(null);

  const onClickEdit     = () => history.push(`${EDIT_PRODUCT}/${product.id}`);
  const onDeleteProduct = () => productRef.current.classList.toggle('item-active');
  const onConfirmDelete = () => {
    dispatch(removeProduct(product.id));
    displayActionMessage('Producto eliminado correctamente');
    productRef.current.classList.remove('item-active');
  };
  const onCancelDelete  = () => productRef.current.classList.remove('item-active');

  const modelsCount = product.models?.length || 0;

  return (
    <SkeletonTheme color="#1e1e1e" highlightColor="#2a2a2a">
      <div
        className={`item item-products ${!product.id && 'item-loading'}`}
        ref={productRef}
      >
        <div className="grid grid-count-6">

          {/* Thumbnail */}
          <div className="grid-col item-img-wrapper">
            {product.id ? (
              product.previewImageURL ? (
                <img
                  alt={product.name}
                  className="item-img"
                  src={product.previewImageURL}
                  style={{ width: 50, height: 30, objectFit: 'cover', borderRadius: 4 }}
                />
              ) : (
                <div style={{
                  width: 50, height: 30,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #252525',
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.55rem', color: '#444', fontWeight: '700', letterSpacing: '0.05em'
                }}>
                  SIN IMG
                </div>
              )
            ) : <Skeleton width={50} height={30} />}
          </div>

          {/* Nombre */}
          <div className="grid-col">
            <span className="text-overflow-ellipsis" style={{ color: '#f1f5f9' }}>
              {product.name || <Skeleton width={80} />}
            </span>
          </div>

          {/* Categoría */}
          <div className="grid-col">
            <span style={{ color: '#94a3b8' }}>
              {product.category || <Skeleton width={60} />}
            </span>
          </div>

          {/* Precio */}
          <div className="grid-col">
            <span style={{ color: '#ff6680', fontWeight: '600' }}>
              {product.price ? displayMoney(product.price) : <Skeleton width={40} />}
            </span>
          </div>

          {/* Fecha */}
          <div className="grid-col">
            <span style={{ color: '#555', fontSize: '0.85rem' }}>
              {product.dateAdded ? displayDate(product.dateAdded) : <Skeleton width={60} />}
            </span>
          </div>

          {/* Modelos */}
          <div className="grid-col">
            {product.id ? (
              <span style={{
                backgroundColor: modelsCount > 1 ? 'rgba(255,36,66,0.12)' : '#1a1a1a',
                color: modelsCount > 1 ? '#ff2442' : '#555',
                border: `1px solid ${modelsCount > 1 ? 'rgba(255,36,66,0.25)' : '#252525'}`,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: '600'
              }}>
                {modelsCount} {modelsCount === 1 ? 'modelo' : 'modelos'}
              </span>
            ) : <Skeleton width={50} height={20} />}
          </div>
        </div>

        {product.id && (
          <div className="item-action">
            <button className="button button-border button-small" onClick={onClickEdit} type="button">
              Editar
            </button>
            &nbsp;
            <button className="button button-border button-small button-danger" onClick={onDeleteProduct} type="button">
              Eliminar
            </button>
            <div className="item-action-confirm">
              <h5>¿Eliminar este producto?</h5>
              <button className="button button-small button-border" onClick={onCancelDelete} type="button">No</button>
              &nbsp;
              <button className="button button-small button-danger" onClick={onConfirmDelete} type="button">Sí</button>
            </div>
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
};

ProductItem.propTypes = {
  product: PropType.shape({
    id: PropType.string,
    name: PropType.string,
    category: PropType.string,
    price: PropType.number,
    previewImageURL: PropType.string,
    models: PropType.array,
    isFeatured: PropType.bool,
    isRecommended: PropType.bool,
    dateAdded: PropType.number
  }).isRequired
};

export default withRouter(ProductItem);
