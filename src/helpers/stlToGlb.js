import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Convierte un archivo .stl en un Blob .glb listo para subir.
 * @param {File} stlFile - El archivo STL del input del admin.
 * @returns {Promise<Blob>} - Un Blob con el contenido GLB binario.
 */
export const convertSTLtoGLB = (stlFile) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(event.target.result);

        // Centrar la geometría
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Normalizar escala para que el modelo quepa bien en el visor
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 1 / maxDim;
          geometry.scale(scale, scale, scale);
        }

        // Material neutro (el color se aplica en el visor en runtime)
        const material = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.2,
          roughness: 0.6,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Exportar a GLB binario
        const exporter = new GLTFExporter();
        exporter.parse(
          mesh,
          (glbBuffer) => {
            const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
            resolve(blob);
          },
          (error) => reject(error),
          { binary: true }
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error leyendo el archivo STL'));
    reader.readAsArrayBuffer(stlFile);
  });
