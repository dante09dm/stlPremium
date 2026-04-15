/**
 * compress-glb.js — Comprime un GLB con Draco (hasta 90% más liviano)
 *
 * USO:
 *   node compress-glb.js archivo.glb
 *   node compress-glb.js archivo.glb salida-comprimido.glb
 *
 * Luego subí el archivo comprimido a Firebase Storage reemplazando el original.
 * El ThreeViewer ya está configurado para leer Draco automáticamente.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const input  = process.argv[2];
const output = process.argv[3] || input.replace(/\.glb$/i, '-draco.glb');

if (!input) {
  console.error('❌  Uso: node compress-glb.js archivo.glb');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`❌  No encontré el archivo: ${input}`);
  process.exit(1);
}

const before = (fs.statSync(input).size / 1024 / 1024).toFixed(1);
console.log(`📦  Original: ${before} MB`);
console.log(`⚙️   Comprimiendo con Draco...`);

try {
  execSync(
    `npx gltf-pipeline -i "${input}" -o "${output}" --draco.compressionLevel 10`,
    { stdio: 'inherit' }
  );
  const after = (fs.statSync(output).size / 1024 / 1024).toFixed(1);
  const pct   = Math.round((1 - after / before) * 100);
  console.log(`\n✅  Listo! ${before} MB → ${after} MB (${pct}% más liviano)`);
  console.log(`📁  Archivo: ${path.resolve(output)}`);
  console.log(`\n👉  Subilo a Firebase Storage reemplazando el GLB original.`);
} catch (e) {
  console.error('❌  Error al comprimir:', e.message);
}
