import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import { MessageDisplay } from '@/components/common';
import { ProductShowcaseGrid } from '@/components/product';
import {
  FEATURED_PRODUCTS,
  RECOMMENDED_PRODUCTS,
  SHOP
} from '@/constants/routes';
import {
  useDocumentTitle,
  useFeaturedProducts,
  useRecommendedProducts,
  useScrollTop
} from '@/hooks';

const Home = () => {
  useDocumentTitle('STL Premium | Modelos 3D para Imprimir');
  useScrollTop();

  const {
    featuredProducts,
    fetchFeaturedProducts,
    isLoading: isLoadingFeatured,
    error: errorFeatured
  } = useFeaturedProducts(6);

  const {
    recommendedProducts,
    fetchRecommendedProducts,
    isLoading: isLoadingRecommended,
    error: errorRecommended
  } = useRecommendedProducts(6);

  return (
    <main className="content" style={{ paddingTop: '7rem', flexDirection: 'column', padding: '0' }}>
      <div className="home">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-eyebrow">Marketplace de modelos 3D</span>
            <h1 className="hero-title">
              Imprimí lo que<br />
              <span className="highlight">imaginás</span>
            </h1>
            <p className="hero-sub">
              Modelos STL premium listos para imprimir. Elegí tu color de filamento,
              preview en 3D y descargá al instante.
            </p>
            <div className="hero-actions">
              <Link to={SHOP} className="btn-primary">
                Explorar modelos &nbsp;<ArrowRightOutlined />
              </Link>
              <Link to={FEATURED_PRODUCTS} className="btn-ghost">
                Ver destacados
              </Link>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">15+</span>
                <span className="stat-label">Colores</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">3D</span>
                <span className="stat-label">Preview interactivo</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">STL</span>
                <span className="stat-label">Descarga directa</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">∞</span>
                <span className="stat-label">Posibilidades</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Productos destacados ────────────────────────────────────────── */}
        <div style={{ padding: '0 8rem' }}>

          <div className="display">
            <div className="display-header">
              <h1>Productos destacados</h1>
              <Link to={FEATURED_PRODUCTS}>Ver todos →</Link>
            </div>
            {(errorFeatured && !isLoadingFeatured) ? (
              <MessageDisplay
                message={errorFeatured}
                action={fetchFeaturedProducts}
                buttonLabel="Reintentar"
              />
            ) : (
              <ProductShowcaseGrid
                products={featuredProducts}
                skeletonCount={6}
              />
            )}
          </div>

          <div className="section-divider" />

          <div className="display">
            <div className="display-header">
              <h1>Recomendados</h1>
              <Link to={RECOMMENDED_PRODUCTS}>Ver todos →</Link>
            </div>
            {(errorRecommended && !isLoadingRecommended) ? (
              <MessageDisplay
                message={errorRecommended}
                action={fetchRecommendedProducts}
                buttonLabel="Reintentar"
              />
            ) : (
              <ProductShowcaseGrid
                products={recommendedProducts}
                skeletonCount={6}
              />
            )}
          </div>

        </div>
      </div>
    </main>
  );
};

export default Home;
