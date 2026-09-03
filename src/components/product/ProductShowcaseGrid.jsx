/* eslint-disable react/forbid-prop-types */
import { FeaturedProduct } from '@/components/product';
import PropType from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';

const SKELETON_DELAY = 280;

const ProductShowcase = ({ products, skeletonCount }) => {
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
  const itemsToRender = !isEmpty
    ? products
    : (showSkeletons ? new Array(skeletonCount).fill({}) : []);

  return (
    <div className="product-display-grid" ref={gridRef}>
      {itemsToRender.map((product, index) => (
        <FeaturedProduct
          // eslint-disable-next-line react/no-array-index-key
          key={product.id || `product-skeleton ${index}`}
          product={product}
        />
      ))}
    </div>
  );
};

ProductShowcase.defaultProps = {
  skeletonCount: 4
};

ProductShowcase.propTypes = {
  products: PropType.array.isRequired,
  skeletonCount: PropType.number
};

export default ProductShowcase;
