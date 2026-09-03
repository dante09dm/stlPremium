import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate } from 'animejs';

/**
 * Envuelve el contenido principal del router. Cada vez que cambia el pathname,
 * dispara un fade-in + translateY corto sobre el wrapper. Cubre el flash de
 * placeholders que aparece entre rutas y le da una sensación más continua
 * a la navegación.
 *
 * Respeta `prefers-reduced-motion`: si el usuario tiene esa preferencia activada,
 * no anima nada (cumple WCAG y no marea a quienes son sensibles al movimiento).
 */
const RouteTransition = ({ children }) => {
  const wrapperRef = useRef(null);
  const location = useLocation();
  const prevPathRef = useRef(null);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    animate(el, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 280,
      ease: 'outQuad',
    });
  }, [location.pathname]);

  return (
    <div ref={wrapperRef} style={{ willChange: 'opacity, transform' }}>
      {children}
    </div>
  );
};

export default RouteTransition;
