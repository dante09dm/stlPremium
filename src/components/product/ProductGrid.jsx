import { useBasket } from '@/hooks';
import PropType from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import ProductItem from './ProductItem';

// Tiempo que esperamos antes de mostrar skeletons (alineado con el fade del RouteTransition).
// Si los datos llegan antes (Redux cacheado), nunca se muestran placeholders.
const SKELETON_DELAY = 280;
const SKELETON_COUNT = 12;

const ProductGrid = ({ products }) => {
  const { addToBasket, isItemOnBasket } = useBasket();
  const gridRef = useRef(null);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (products.length > 0) {
      setShowSkeletons(false);
      return undefined;
    }
    setShowSkeletons(false);
    const timer = setTimeout(() => setShowSkeletons(true), SKELETON_DELAY);
    return () => clearTimeout(timer);
  }, [products.length]);

  useEffect(() => {
    if (!gridRef.current) return;
    if (products.length === 0) return;
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    animate(Array.from(gridRef.current.children), {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 360,
      delay: stagger(35),
      ease: 'outQuad',
    });
  }, [products.length]);

  const isEmpty = products.length === 0;

  return (
    <div className="product-grid" ref={gridRef}>
      {isEmpty
        ? (showSkeletons
          ? new Array(SKELETON_COUNT).fill({}).map((product, index) => (
            <ProductItem
              // eslint-disable-next-line react/no-array-index-key
              key={`product-skeleton ${index}`}
              product={product}
            />
          ))
          : null)
        : products.map((product) => (
          <ProductItem
            key={product.id}
            isItemOnBasket={isItemOnBasket}
            addToBasket={addToBasket}
            product={product}
          />
        ))}
    </div>
  );
};

ProductGrid.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  products: PropType.array.isRequired
};

export default ProductGrid;
