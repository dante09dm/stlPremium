import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export function makeLoader() {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

// ─── Cache global: evita redescargar GLBs ya cargados ─────────────────────────
const gltfCache = new Map(); // url → gltf object

export function preloadGLB(url) {
  if (!url || gltfCache.has(url)) return;
  gltfCache.set(url, 'loading');
  makeLoader().load(
    url,
    (gltf) => gltfCache.set(url, gltf),
    undefined,
    () => gltfCache.delete(url)
  );
}

// ─── Three.js para un modelo ───────────────────────────────────────────────────
const ThreeViewer = ({ glbURL, height, onReady }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !glbURL) return;

    const container = mountRef.current;
    const w = container.clientWidth || 280;
    const h = height;
    let cancelled = false;

    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera   = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 0.1, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    try { renderer.outputColorSpace = THREE.SRGBColorSpace; }
    catch (_) { renderer.outputEncoding = THREE.sRGBEncoding; } // eslint-disable-line

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(2, 4, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff4455, 0.2);
    fill.position.set(-3, -1, -2);
    scene.add(fill);

    const s = { running: true, visible: true, mesh: null, rotY: 0 };

    // ── Placeholder: cubo que aparece al instante mientras carga el GLB ────────
    const pGeo = new THREE.BoxGeometry(1, 1, 1);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.55, roughness: 0.35 });
    const placeholder = new THREE.Mesh(pGeo, pMat);
    scene.add(placeholder);
    s.mesh = placeholder;
    // Señala "listo" de inmediato → el contenedor hace fade-in con el placeholder
    if (onReady) onReady();

    const addModel = (gltf) => {
      if (cancelled || !s.running) return;
      // Quita el placeholder (si aún está en escena)
      if (scene.getObjectByProperty('uuid', placeholder.uuid)) {
        scene.remove(placeholder);
        pGeo.dispose();
        pMat.dispose();
      }
      const model = gltf.scene.clone();
      const box   = new THREE.Box3().setFromObject(model);
      const size  = box.getSize(new THREE.Vector3());
      model.position.sub(box.getCenter(new THREE.Vector3()));
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) model.scale.setScalar(1.4 / maxDim);
      model.traverse((c) => {
        if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x9aaabb, metalness: 0.35, roughness: 0.4 });
      });
      scene.add(model);
      s.mesh = model;
      s.rotY = 0;
    };

    // Usa cache si ya está descargado, sino carga normalmente
    const cached = gltfCache.get(glbURL);
    if (cached && cached !== 'loading') {
      addModel(cached);
    } else {
      makeLoader().load(
        glbURL,
        (gltf) => { gltfCache.set(glbURL, gltf); addModel(gltf); },
        undefined,
        () => {}
      );
    }

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!s.running || !s.visible) return;
      if (s.mesh) { s.rotY += 0.009; s.mesh.rotation.y = s.rotY; }
      renderer.render(scene, camera);
    };
    animate();

    const obs = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }, { threshold: 0.1 });
    obs.observe(container);

    const onResize = () => {
      const nw = container.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      s.running = false;
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      // Limpia placeholder por si el GLB nunca terminó de cargar
      if (scene.getObjectByProperty('uuid', placeholder.uuid)) {
        pGeo.dispose();
        pMat.dispose();
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [glbURL, height]); // eslint-disable-line

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }} // ← pass-through mouse events
    />
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const ProductCardViewer = ({ previewImageURL, glbURLs = [], height = 220 }) => {
  const [isHovered,  setIsHovered]  = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [glbVisible, setGlbVisible] = useState(false); // true = GLB opaco, false = PNG visible
  const [isLoading,  setIsLoading]  = useState(false);

  const hovRef    = useRef(false);
  const timerRef  = useRef(null);
  const cardRef   = useRef(null);

  // Preload del primer GLB cuando la card entra al viewport
  useEffect(() => {
    if (!glbURLs[0] || !cardRef.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { glbURLs.forEach(preloadGLB); io.disconnect(); }
    }, { rootMargin: '800px' }); // empieza 800px antes de que sea visible
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, [glbURLs[0]]); // eslint-disable-line

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const resetAll = () => {
    hovRef.current = false;
    clearTimeout(timerRef.current);
    setIsHovered(false);
    setGlbVisible(false);
    setIsLoading(false);
    setActiveIdx(0);
  };

  const handleMouseEnter = () => {
    if (!glbURLs.length) return;
    hovRef.current = true;
    setIsHovered(true);
    setActiveIdx(0);
    setGlbVisible(false);
    setIsLoading(true);
  };

  // mouseLeave en el div padre — reseteo inmediato
  const handleMouseLeave = () => resetAll();

  const scheduleCycle = (idx) => {
    if (glbURLs.length <= 1) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!hovRef.current) return;
      setGlbVisible(false);
      setIsLoading(true);
      setTimeout(() => {
        if (!hovRef.current) return;
        setActiveIdx((prev) => (prev + 1) % glbURLs.length);
      }, 350);
    }, 4500);
  };

  // Navegación manual con flechas
  const navigateTo = (e, nextIdx) => {
    e.stopPropagation();
    if (!hovRef.current || glbURLs.length <= 1) return;
    clearTimeout(timerRef.current);
    setGlbVisible(false);
    setIsLoading(true);
    setTimeout(() => {
      if (!hovRef.current) return;
      setActiveIdx(nextIdx);
    }, 300);
  };

  const handlePrev = (e) => {
    const nextIdx = (activeIdx - 1 + glbURLs.length) % glbURLs.length;
    navigateTo(e, nextIdx);
  };

  const handleNext = (e) => {
    const nextIdx = (activeIdx + 1) % glbURLs.length;
    navigateTo(e, nextIdx);
  };

  const handleReady = () => {
    if (!hovRef.current) return; // salió antes de que cargara
    setIsLoading(false);
    setGlbVisible(true);
    scheduleCycle(activeIdx);
  };

  const hasGlb = glbURLs.length > 0 && !!glbURLs[activeIdx];

  return (
    <div
      ref={cardRef}
      style={{ position: 'relative', width: '100%', height: `${height}px`, overflow: 'hidden', backgroundColor: '#0a0a0a', cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── PNG base — siempre presente, se oculta bajo el GLB ──────────── */}
      {previewImageURL ? (
        <img
          src={previewImageURL}
          alt="preview"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 35%', transform: 'scale(0.95)', transformOrigin: 'center center',
            opacity: glbVisible ? 0 : 1,
            transition: glbVisible ? 'opacity 0.4s ease' : 'opacity 0.2s ease',
            pointerEvents: 'none', zIndex: 1,
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: glbVisible ? 0 : 1, transition: 'opacity 0.3s ease',
        }}>
          <span style={{ fontSize: '0.68rem', color: '#2a2a2a', fontWeight: '700', letterSpacing: '0.1em' }}>SIN IMAGEN</span>
        </div>
      )}

      {/* ── Three.js — solo montado cuando hay hover y GLB ──────────────── */}
      {isHovered && hasGlb && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          opacity: glbVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          <ThreeViewer
            key={`${glbURLs[activeIdx]}-${activeIdx}`}
            glbURL={glbURLs[activeIdx]}
            height={height}
            onReady={handleReady}
          />
        </div>
      )}

      {/* ── Spinner de carga ─────────────────────────────────────────────── */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 24, height: 24,
            border: '2px solid rgba(255,255,255,0.08)',
            borderTop: '2px solid #ff2442',
            borderRadius: '50%',
            animation: 'cvSpin 0.7s linear infinite',
          }} />
          {glbURLs[activeIdx] && (
            <span style={{ fontSize: '0.65rem', color: '#333', letterSpacing: '0.06em' }}>
              cargando 3D…
            </span>
          )}
        </div>
      )}

      {/* ── Flechas de navegación manual (solo bundles en hover) ────────── */}
      {isHovered && glbURLs.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              zIndex: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1rem', backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,36,66,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
            type="button"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              zIndex: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1rem', backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,36,66,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
            type="button"
          >
            ›
          </button>
        </>
      )}

      {/* ── Dots indicadores ────────────────────────────────────────────── */}
      {isHovered && glbURLs.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 10, left: 0, right: 0, zIndex: 4,
          display: 'flex', justifyContent: 'center', gap: 5,
          pointerEvents: 'none',
        }}>
          {glbURLs.map((_, i) => (
            <div key={i} style={{
              width: i === activeIdx ? 14 : 6, height: 6,
              borderRadius: 3,
              backgroundColor: i === activeIdx ? '#ff2442' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      )}

      {/* ── Badge cantidad (oculto en hover) ───────────────────────────── */}
      {glbURLs.length > 1 && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 5,
          backgroundColor: 'rgba(255,36,66,0.85)',
          color: '#fff', fontSize: '0.65rem', fontWeight: '700',
          padding: '2px 7px', borderRadius: '10px',
          backdropFilter: 'blur(4px)', pointerEvents: 'none',
          opacity: isHovered ? 0 : 1, transition: 'opacity 0.25s ease',
        }}>
          {glbURLs.length} modelos
        </div>
      )}

      <style>{`@keyframes cvSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ProductCardViewer;
