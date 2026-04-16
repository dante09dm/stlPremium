import { VIEW_PRODUCT } from '@/constants/routes';

const toProductURL = (id) => VIEW_PRODUCT.replace(':id', id);
import { displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import ProductCardViewer from '@/components/common/ProductCardViewer';

const ProductItem = ({ product }) => {
  const history = useHistory();

  if (!product.id) {
    return (
      <div className="product-card product-loading">
        <div className="product-card-img-wrapper" />
        <div className="product-card-content product-details">
          <div className="product-card-name" style={{ background: '#2a2a2a', height: 14, borderRadius: 4, marginBottom: 6 }} />
          <div className="product-card-brand" style={{ background: '#222', height: 10, borderRadius: 4, width: '60%', margin: '0 auto 6px' }} />
          <div style={{ background: '#222', height: 12, borderRadius: 4, width: '40%', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const glbURLs = product.models?.map((m) => m.glbURL).filter(Boolean) || [];

  return (
    <div
      className="product-card"
      onClick={() => history.push(toProductURL(product.id))}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && history.push(toProductURL(product.id))}
      style={{ height: 'auto', maxWidth: '100%', cursor: 'pointer' }}
    >
      {/* Imagen / visor 3D */}
      <ProductCardViewer
        previewImageURL={product.previewImageURL || null}
        glbURLs={glbURLs}
        height={200}
        onNavigate={() => history.push(toProductURL(product.id))}
      />

      {/* Info */}
      <div className="product-card-content product-details" style={{ padding: '0.8rem 1rem' }}>
        <p className="product-card-name text-overflow-ellipsis" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.2rem' }}>
          {product.name}
        </p>
        <p className="product-card-brand">{product.category}</p>
        <p className="product-card-price" style={{ fontSize: '1.4rem', marginTop: '0.4rem' }}>
          {displayMoney(product.price)}
        </p>
      </div>
    </div>
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
  }).isRequired,
};

export default ProductItem;
