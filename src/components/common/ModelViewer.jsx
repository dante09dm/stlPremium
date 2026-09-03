import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { animate } from 'animejs';
import { makeLoader } from './ProductCardViewer.jsx';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ── Paleta estándar de filamentos ─────────────────────────────────────────────
export const FILAMENT_COLORS = [
  { name: 'Blanco',        hex: '#FFFFFF', threejs: 0xFFFFFF },
  { name: 'Negro',         hex: '#1a1a1a', threejs: 0x1a1a1a },
  { name: 'Gris',          hex: '#808080', threejs: 0x808080 },
  { name: 'Plata',         hex: '#C0C0C0', threejs: 0xC0C0C0 },
  { name: 'Rojo',          hex: '#DC2626', threejs: 0xDC2626 },
  { name: 'Azul',          hex: '#2563EB', threejs: 0x2563EB },
  { name: 'Verde',         hex: '#16A34A', threejs: 0x16A34A },
  { name: 'Amarillo',      hex: '#EAB308', threejs: 0xEAB308 },
  { name: 'Naranja',       hex: '#EA580C', threejs: 0xEA580C },
  { name: 'Violeta',       hex: '#7C3AED', threejs: 0x7C3AED },
  { name: 'Rosa',          hex: '#EC4899', threejs: 0xEC4899 },
  { name: 'Dorado',        hex: '#D4AF37', threejs: 0xD4AF37 },
  { name: 'Marrón',        hex: '#92400E', threejs: 0x92400E },
  { name: 'Celeste',       hex: '#0891B2', threejs: 0x0891B2 },
  { name: 'Natural',       hex: '#E8DCC8', threejs: 0xE8DCC8 },
];

const ModelViewer = ({
  glbURL,
  availableColors,
  height = 380,
  autoRotate = true,
  models = null,
  selectedModelIndex = 0,
  onSelectModel = null,
}) => {
  const hasMultipleModels = !!(models && models.length > 1 && onSelectModel);
  const mountRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const modelRef = useRef(null);
  const loadIdRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const chipRefs = useRef([]);
  const prevSelectedIdxRef = useRef(selectedModelIndex);

  const colors = availableColors || FILAMENT_COLORS;
  // Default = Plata: el acabado metálico hace que se aprecien los detalles del modelo
  const defaultColor = colors.find((c) => c.name === 'Plata') || colors[0];
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Inicializar Three.js una sola vez ─────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const w = container.clientWidth || 400;
    const h = height;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 0.2, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, 2, -3);
    scene.add(fill);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    const animateLoop = () => {
      animFrameRef.current = requestAnimationFrame(animateLoop);
      controls.update();
      renderer.render(scene, camera);
    };
    animateLoop();

    const onResize = () => {
      const nw = container.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [height, autoRotate]);

  // ── Cargar modelo GLB cuando cambia la URL ────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || !glbURL) return;

    const loadId = ++loadIdRef.current;
    const isFirst = isFirstLoadRef.current;
    isFirstLoadRef.current = false;
    const wrapper = canvasWrapperRef.current;

    if (isFirst) setIsLoading(true);
    setError(null);

    let fadeOutPromise = Promise.resolve();
    if (modelRef.current && wrapper && !isFirst) {
      fadeOutPromise = animate(wrapper, {
        opacity: [1, 0],
        duration: 160,
        ease: 'inOutQuad',
      });
    }

    const disposeModel = (m) => {
      m.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
            else child.material.dispose();
          }
        }
      });
    };

    const loader = makeLoader();
    loader.load(
      glbURL,
      async (gltf) => {
        if (loadId !== loadIdRef.current) return;
        if (!sceneRef.current) return;

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.position.y -= 0.12;
        if (maxDim > 0) {
          const scale = 1.5 / maxDim;
          model.scale.setScalar(scale);
        }

        applyColor(model, selectedColor.threejs);

        try { await fadeOutPromise; } catch (e) { /* noop */ }

        if (loadId !== loadIdRef.current) { disposeModel(model); return; }
        if (!sceneRef.current) { disposeModel(model); return; }

        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          disposeModel(modelRef.current);
        }

        sceneRef.current.add(model);
        modelRef.current = model;

        if (cameraRef.current) cameraRef.current.position.set(0, 0.2, 3.2);
        if (controlsRef.current) controlsRef.current.reset();

        setIsLoading(false);

        if (wrapper && !isFirst) {
          animate(wrapper, {
            opacity: [0, 1],
            duration: 200,
            ease: 'inOutQuad',
          });
        }
      },
      undefined,
      (err) => {
        if (loadId !== loadIdRef.current) return;
        console.error('Error cargando GLB:', err);
        setError('No se pudo cargar el modelo 3D');
        setIsLoading(false);
        if (wrapper) {
          animate(wrapper, { opacity: 1, duration: 200 });
        }
      }
    );
  }, [glbURL]);

  // ── Animar chip activo cuando cambia el modelo seleccionado ──────────────
  useEffect(() => {
    if (prevSelectedIdxRef.current === selectedModelIndex) return;
    prevSelectedIdxRef.current = selectedModelIndex;
    const el = chipRefs.current[selectedModelIndex];
    if (!el) return;
    animate(el, {
      scale: [1, 1.12, 1],
      duration: 380,
      ease: 'outQuad',
    });
  }, [selectedModelIndex]);

  // ── Pre-cache de los GLB del bundle para que cambiar de modelo sea instantáneo ──
  useEffect(() => {
    if (!models || models.length <= 1) return;
    const controllers = models
      .filter((m) => m.glbURL)
      .map((m) => {
        const ctrl = new AbortController();
        fetch(m.glbURL, { signal: ctrl.signal })
          .then((res) => res.arrayBuffer())
          .catch(() => {});
        return ctrl;
      });
    return () => {
      controllers.forEach((c) => c.abort());
    };
  }, [models]);

  // ── Cambiar color en tiempo real ──────────────────────────────────────────
  useEffect(() => {
    if (modelRef.current) {
      applyColor(modelRef.current, selectedColor.threejs);
    }
  }, [selectedColor]);

  const applyColor = (object, colorHex) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: colorHex,
          metalness: colorHex === 0xC0C0C0 || colorHex === 0xD4AF37 ? 0.6 : 0.15,
          roughness: colorHex === 0xC0C0C0 || colorHex === 0xD4AF37 ? 0.2 : 0.55,
        });
      }
    });
  };

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={canvasWrapperRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#15181f',
          backgroundImage: [
            'radial-gradient(ellipse 50% 18% at 50% 92%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
            'radial-gradient(ellipse 75% 65% at 50% 38%, #2a3140 0%, #1a1e26 55%, #0d0f14 100%)',
          ].join(', '),
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.45)',
        }}
      >
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'transparent', zIndex: 2,
            gap: '0.75rem', color: '#94a3b8'
          }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid rgba(148,163,184,0.25)',
              borderTop: '3px solid #ff2442',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.85rem' }}>Cargando modelo...</span>
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '1rem'
          }}>
            {error}
          </div>
        )}
        {!glbURL && !isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', fontSize: '0.85rem'
          }}>
            Sin modelo disponible
          </div>
        )}

        {hasMultipleModels && (
          <>
            <button
              type="button"
              onClick={() => onSelectModel(
                (selectedModelIndex - 1 + models.length) % models.length
              )}
              aria-label="Modelo anterior"
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                zIndex: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.2rem', backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,36,66,0.75)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => onSelectModel(
                (selectedModelIndex + 1) % models.length
              )}
              aria-label="Modelo siguiente"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                zIndex: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.2rem', backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,36,66,0.75)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
            >
              ›
            </button>
          </>
        )}

        {hasMultipleModels && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '0.75rem',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 'calc(100% - 6rem)',
            padding: '0.35rem 0.5rem',
            backgroundColor: 'rgba(17, 24, 39, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: '10px',
            zIndex: 5,
            pointerEvents: 'auto',
          }}>
            {models.map((model, i) => (
              <button
                key={i}
                type="button"
                ref={(el) => { chipRefs.current[i] = el; }}
                onClick={() => onSelectModel(i)}
                style={{
                  padding: '0.3rem 0.65rem',
                  backgroundColor: selectedModelIndex === i ? '#ff2442' : 'rgba(255,255,255,0.9)',
                  color: selectedModelIndex === i ? '#fff' : '#111827',
                  border: selectedModelIndex === i ? '1px solid #ff2442' : '1px solid rgba(255,255,255,0.6)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  transition: 'background-color 0.15s, color 0.15s, border 0.15s',
                  whiteSpace: 'nowrap',
                  willChange: 'transform',
                }}
              >
                {model.name || `Modelo ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isLoading && !error && glbURL && (
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', margin: '0.4rem 0 0.75rem' }}>
          Arrastrá para rotar · Scroll para zoom
        </p>
      )}

      <div style={{ marginTop: '0.5rem', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
          Color de filamento:&nbsp;
          <span style={{ fontWeight: '400', color: '#ff2442' }}>{selectedColor.name}</span>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => setSelectedColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: c.hex,
                border: selectedColor.name === c.name
                  ? '3px solid #ff2442'
                  : '2px solid #d1d5db',
                cursor: 'pointer',
                boxShadow: selectedColor.name === c.name
                  ? '0 0 0 2px #c7d2fe'
                  : 'none',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ModelViewer;
