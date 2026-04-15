import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
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

/**
 * Visor 3D de modelos GLB con selector de color de filamento.
 *
 * Props:
 *   glbURL        {string}   URL del archivo GLB en Firebase Storage
 *   availableColors {array}  (opcional) subset de FILAMENT_COLORS para este producto
 *   height        {number}   altura del canvas en px (default 380)
 *   autoRotate    {boolean}  rotación automática (default true)
 */
const ModelViewer = ({
  glbURL,
  availableColors,
  height = 380,
  autoRotate = true,
}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const modelRef = useRef(null);

  const colors = availableColors || FILAMENT_COLORS;
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Inicializar Three.js una sola vez ─────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const w = container.clientWidth || 400;
    const h = height;

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    // Cámara
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 0.2, 3.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, 2, -3);
    scene.add(fill);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // Loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Responsive
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

    setIsLoading(true);
    setError(null);

    // Remover modelo anterior
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const loader = makeLoader();
    loader.load(
      glbURL,
      (gltf) => {
        const model = gltf.scene;

        // Centrar y escalar
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.position.y -= 0.12; // baja levemente el modelo en el encuadre
        if (maxDim > 0) {
          const scale = 1.5 / maxDim;
          model.scale.setScalar(scale);
        }

        // Aplicar color actual
        applyColor(model, selectedColor.threejs);

        sceneRef.current.add(model);
        modelRef.current = model;

        // Resetear cámara
        if (cameraRef.current) cameraRef.current.position.set(0, 0.2, 3.2);
        if (controlsRef.current) controlsRef.current.reset();

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error cargando GLB:', err);
        setError('No se pudo cargar el modelo 3D');
        setIsLoading(false);
      }
    );
  }, [glbURL]);

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
      {/* Canvas */}
      {/* Wrapper: Three.js canvas + overlays sin mezclar con React DOM */}
      <div style={{ position: 'relative', width: '100%', height: `${height}px`, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        {/* Canvas Three.js — React no renderiza nada adentro */}
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#f3f4f6', zIndex: 2,
            gap: '0.75rem', color: '#94a3b8'
          }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid #e2e8f0',
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
      </div>

      {/* Hint de interacción */}
      {!isLoading && !error && glbURL && (
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', margin: '0.4rem 0 0.75rem' }}>
          Arrastrá para rotar · Scroll para zoom
        </p>
      )}

      {/* Color chooser */}
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
