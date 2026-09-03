import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { MessageDisplay } from '@/components/common';
import ModelViewer from '@/components/common/ModelViewer';
import { ProductShowcaseGrid } from '@/components/product';
import { SHOP } from '@/constants/routes';
import { displayMoney } from '@/helpers/utils';
import {
  useBasket,
  useDocumentTitle,
  useProduct,
  useRecommendedProducts,
  useScrollTop
} from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const ViewProduct = () => {
  const { id } = useParams();
  const { product, isLoading, error } = useProduct(id);
  const { addToBasket, isItemOnBasket, removeFromBasket } = useBasket();
  useScrollTop();
  useDocumentTitle(`${product?.name || 'Producto'}`);

  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  const {
    recommendedProducts,
    fetchRecommendedProducts,
    isLoading: isLoadingRecommended,
    error: errorRecommended
  } = useRecommendedProducts(6);

  useEffect(() => {
    if (product) setSelectedModelIndex(0);
  }, [product]);

  const isProductInBasket = isItemOnBasket(product?.id);

  const handleAddToBasket = () => {
    if (!product) return;
    addToBasket({ ...product, id: product.id });
  };

  const handleRemoveFromBasket = () => {
    if (!product) return;
    removeFromBasket(product.id);
  };

  const selectedModel = product?.models?.[selectedModelIndex];

  return (
    <main className="content">
      {isLoading && (
        <div className="loader">
          <h4>Cargando Producto...</h4>
          <br />
          <LoadingOutlined style={{ fontSize: '3rem' }} />
        </div>
      )}
      {error && <MessageDisplay message={error} />}
      {product && !isLoading && (
        <div className="product-view">
          <Link to={SHOP}>
            <h3 className="button-link d-inline-flex">
              <ArrowLeftOutlined />
              &nbsp; Volver a la tienda
            </h3>
          </Link>

          <div className="product-modal">

            {/* ── Panel izquierdo: visor 3D ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ModelViewer
                glbURL={selectedModel?.glbURL || null}
                availableColors={product.availableColors || null}
                height={380}
                autoRotate={true}
                models={product.models || null}
                selectedModelIndex={selectedModelIndex}
                onSelectModel={setSelectedModelIndex}
              />
            </div>

            {/* ── Panel derecho: detalles ── */}
            <div className="product-modal-details">
              <br />
              {product.category && (
                <span className="text-subtle">{product.category}</span>
              )}
              <h1 className="margin-top-0">{product.name}</h1>
              <span>{product.description}</span>
              <br /><br />

              {/* Info del bundle */}
              {product.models?.length > 0 && (
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#1e0608',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,36,66,0.35)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#fca5a5', fontWeight: '600' }}>
                    📦 {product.models.length === 1
                      ? '1 modelo incluido'
                      : `Bundle: ${product.models.length} modelos incluidos`}
                  </p>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                    {product.models.map((m, i) => (
                      <li key={i}>{m.name || `Modelo ${i + 1}`}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="divider" />
              <br />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{displayMoney(product.price)}</h1>
                {product.models?.length > 1 && (
                  <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: '600' }}>
                    c/u
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Después de la compra podés descargar los archivos STL desde tu cuenta.
              </p>

              <div className="product-modal-action">
                {!isProductInBasket ? (
                  <button
                    className="button button-small"
                    onClick={handleAddToBasket}
                    type="button"
                  >
                    Agregar a la compra
                  </button>
                ) : (
                  <button
                    className="button button-small button-border button-border-gray"
                    onClick={handleRemoveFromBasket}
                    type="button"
                  >
                    Eliminar de la compra
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Productos recomendados — se oculta si la query devuelve vacío */}
          {!errorRecommended && (
            <div style={{ marginTop: '10rem' }}>
              <div className="display-header">
                <h1>Recomendados</h1>
              </div>
              <ProductShowcaseGrid products={recommendedProducts} skeletonCount={3} />
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ViewProduct;
