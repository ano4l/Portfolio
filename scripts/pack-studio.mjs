import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const authoring = path.resolve('docs/studio-art');
const destination = path.resolve('public/assets/studio');
await mkdir(destination, { recursive: true });
const source = await readFile(path.join(authoring, 'studio-source.glb'));
const jsonLength = source.readUInt32LE(12);
const document = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const binaryStart = 20 + jsonLength + 8;
const binary = source.subarray(binaryStart);
const bakeGains = JSON.parse(await readFile(path.join(authoring, 'bake-manifest.json'), 'utf8'));
const replacementImages = new Map();
const bakedTextures = {};
const restingHeights = { novalens: .936, forma: .94, atlas: .936, sketchbook: .94, cv: .912, index: .94, about: .912, 'digital-twin': .912, collection: .912 };
for (const node of document.nodes) {
  if (node.extras?.studio_id in restingHeights) node.translation[1] = restingHeights[node.extras.studio_id] * .2;
  if (node.extras?.studio_id === 'about') node.translation[0] = 3.8 * .2;
}
for (const name of ['architecture', 'desk']) {
  const packed = await sharp(path.join(authoring, `${name}-diffuse.png`)).webp({ lossless: true }).toBuffer();
  const viewIndex = document.bufferViews.push({ buffer: 0, byteOffset: 0, byteLength: packed.length }) - 1;
  const imageIndex = document.images.push({ name: `${name}-baked-diffuse`, bufferView: viewIndex, mimeType: 'image/webp' }) - 1;
  replacementImages.set(viewIndex, packed);
  bakedTextures[name] = document.textures.push({ extensions: { EXT_texture_webp: { source: imageIndex } } }) - 1;
}

function assignBake(nodeIndex, bake) {
  const node = document.nodes[nodeIndex];
  if (node.mesh !== undefined) {
    for (const primitive of document.meshes[node.mesh].primitives) {
      const material = document.materials[primitive.material];
      if (material.name.startsWith('Window glow') || material.name.startsWith('Personal photograph')) {
        delete material.extras.studio_bounce;
        delete material.occlusionTexture;
        if (material.name.startsWith('Personal photograph')) material.extras.studio_photo = true;
        continue;
      }
      material.extras = { ...material.extras, studio_bounce: bake, studio_bake_gain: bakeGains[bake] };
      // A light map is RGB irradiance, not the red channel of a packed AO/ORM map.
      delete material.occlusionTexture;
      material.pbrMetallicRoughness.baseColorTexture = { index: bakedTextures[bake], texCoord: 1 };
      material.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
    }
  }
  for (const child of node.children || []) assignBake(child, bake);
}
document.nodes.forEach((node, index) => {
  if (['architecture', 'desk'].includes(node.name)) assignBake(index, node.name);
});
for (const material of document.materials) {
  if (material.name.startsWith('Walnut veneer')) {
    material.pbrMetallicRoughness.roughnessFactor = .9;
  }
}

// Prune unused source albedos and UV-marker textures before shipping the model.
function visitTextureInfo(value, visit) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key.endsWith('Texture') && child && Number.isInteger(child.index)) visit(child);
    else visitTextureInfo(child, visit);
  }
}
const usedTextures = new Set();
for (const material of document.materials) visitTextureInfo(material, info => usedTextures.add(info.index));
const textureIndices = [...usedTextures].sort((a, b) => a - b);
const textureMap = new Map(textureIndices.map((index, next) => [index, next]));
document.textures = textureIndices.map(index => document.textures[index]);
for (const material of document.materials) visitTextureInfo(material, info => { info.index = textureMap.get(info.index); });
const usedImages = new Set();
for (const texture of document.textures) {
  if (texture.source !== undefined) usedImages.add(texture.source);
  for (const extension of Object.values(texture.extensions || {})) if (extension.source !== undefined) usedImages.add(extension.source);
}
const imageIndices = [...usedImages].sort((a, b) => a - b);
const imageMap = new Map(imageIndices.map((index, next) => [index, next]));
document.images = imageIndices.map(index => document.images[index]);
for (const texture of document.textures) {
  if (texture.source !== undefined) texture.source = imageMap.get(texture.source);
  for (const extension of Object.values(texture.extensions || {})) if (extension.source !== undefined) extension.source = imageMap.get(extension.source);
}
for (const [index, image] of document.images.entries()) {
  if (replacementImages.has(image.bufferView)) continue;
  const view = document.bufferViews[image.bufferView];
  const bytes = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const isData = /nor_gl|Rough|_arm_|bounce/.test(image.name || '');
  const quality = /cv-page/.test(image.name || '') ? 98 : isData ? 96 : 91;
  const maxWidth = /anotida-portrait|aws-execleaders/.test(image.name || '') ? 640 : /aloir-web/.test(image.name || '') ? 800 : 1600;
  const packed = await sharp(bytes).resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
  replacementImages.set(image.bufferView, packed);
  image.mimeType = 'image/webp';
  if (!document.textures.some(texture => texture.source === index)) continue;
  for (const texture of document.textures.filter(texture => texture.source === index)) {
    texture.extensions = { ...texture.extensions, EXT_texture_webp: { source: index } };
    delete texture.source;
  }
}
const buffers = [];
let offset = 0;
for (const [index, view] of document.bufferViews.entries()) {
  const used = document.images.some(image => image.bufferView === index) || document.accessors.some(accessor => accessor.bufferView === index || accessor.sparse?.indices.bufferView === index || accessor.sparse?.values.bufferView === index);
  if (!used) { view._studioUnused = true; continue; }
  const bytes = replacementImages.get(index) || binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  view.byteOffset = offset;
  view.byteLength = bytes.length;
  buffers.push(bytes);
  offset += bytes.length;
  const padding = (4 - offset % 4) % 4;
  if (padding) buffers.push(Buffer.alloc(padding));
  offset += padding;
}
const viewMap = new Map();
document.bufferViews = document.bufferViews.filter((view, index) => {
  if (view._studioUnused) return false;
  viewMap.set(index, viewMap.size);
  return true;
});
for (const image of document.images) image.bufferView = viewMap.get(image.bufferView);
for (const accessor of document.accessors) {
  if (accessor.bufferView !== undefined) accessor.bufferView = viewMap.get(accessor.bufferView);
  if (accessor.sparse) {
    accessor.sparse.indices.bufferView = viewMap.get(accessor.sparse.indices.bufferView);
    accessor.sparse.values.bufferView = viewMap.get(accessor.sparse.values.bufferView);
  }
}
document.buffers = [{ byteLength: offset }];
document.extensionsUsed = [...new Set([...(document.extensionsUsed || []), 'EXT_texture_webp'])];
document.extensionsRequired = [...new Set([...(document.extensionsRequired || []), 'EXT_texture_webp'])];
const json = Buffer.from(JSON.stringify(document));
const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const packedBinary = Buffer.concat(buffers);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + packedBinary.length, 8);
header.writeUInt32LE(jsonPadded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(packedBinary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(path.join(destination, 'office.glb'), Buffer.concat([header, jsonPadded, binaryHeader, packedBinary]));
await sharp(path.join(authoring, 'studio-reference.png')).webp({ quality: 85 }).toFile(path.join(destination, 'reference.webp'));
let poster;
try { poster = await readFile(path.join(authoring, 'browser-poster.png')); }
catch { poster = await readFile(path.join(authoring, 'studio-reference.png')); }
await sharp(poster).webp({ quality: 85 }).toFile(path.join(destination, 'poster.webp'));
const triangleCount = document.meshes.reduce((count, mesh) => count + mesh.primitives.reduce((sum, primitive) => sum + document.accessors[primitive.indices].count / 3, 0), 0);
await writeFile(path.join(destination, 'asset-manifest.json'), JSON.stringify({ authoring: 'Blender 4.5.9 LTS / Cycles', unitsToScene: 5, modelBytes: 28 + jsonPadded.length + packedBinary.length, triangles: triangleCount, imageCount: document.images.length, bakedMaterials: ['architecture', 'desk'], sources: [{ name: 'Smoked Walnut Veneer', author: 'Jenelle van Heerden', source: 'https://polyhaven.com/a/smoked_walnut_veneer', license: 'CC0-1.0' }, { name: 'Desk Lamp Arm 01', author: 'Kuutti Siitonen and Yann Kervran', source: 'https://polyhaven.com/a/desk_lamp_arm_01', license: 'CC0-1.0' }] }, null, 2));
console.log(`Packed studio: ${(packedBinary.length / 1048576).toFixed(2)} MiB, ${triangleCount.toLocaleString()} triangles`);
