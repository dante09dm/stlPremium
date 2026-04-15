import PropType from 'prop-types';
import React, { useEffect } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useHistory } from 'react-router-dom';
import ProductCardViewer, { preloadGLB } from '@/components/common/ProductCardViewer';

const ProductFeatured = ({ product }) => {
  const history = useHistory();

  const onClickItem = () => {
    if (!product?.id) return;
    history.push(`/product/${product.id}`);
  };

  // Todos los GLBs del pack (para el hover cycle)
  const glbURLs = product?.models
    ?.map((m) => m.glbURL)
    .filter(Boolean) || [];

  // Precarga todos los GLBs apenas el componente recibe los datos
  useEffect(() => {
    glbURLs.forEach(preloadGLB);
  }, [product?.id]); // eslint-disable-line

  return (
    <SkeletonTheme color="#1a2332" highlightColor="#243044">
      <div
        className="product-display"
        onClick={onClickItem}
        role="presentation"
        style={{ cursor: 'pointer' }}
      >
        <div
          className="product-display-img"
          style={{ position: 'relative', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {product?.id ? (
            <ProductCardViewer
              previewImageURL={product.previewImageURL || null}
              glbURLs={glbURLs}
              height={220}
            />
          ) : (
            <Skeleton width="100%" height="100%" />
          )}
        </div>

        <div className="product-display-details" onClick={onClickItem}>
          <h2>{product?.name || <Skeleton width={80} />}</h2>
          <p className="text-subtle text-italic">
            {product?.category || <Skeleton width={40} />}
          </p>
        </div>
      </div>
    </SkeletonTheme>
  );
};

ProductFeatured.propTypes = {
  product: PropType.shape({
    id: PropType.string,
    name: PropType.string,
    category: PropType.string,
    previewImageURL: PropType.string,
    models: PropType.arrayOf(PropType.shape({
      name: PropType.string,
      glbURL: PropType.string,
      stlURLs: PropType.arrayOf(PropType.string),
    })),
  }).isRequired,
};

export default ProductFeatured;
