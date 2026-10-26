import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const PROJECT_IDS = new Set(['novalens', 'forma', 'atlas', 'sketchbook', 'cv', 'index', 'about', 'digital-twin', 'collection']);

/** Load authored geometry before changing the existing scene; failure retains its fallback. */
export async function loadStudioAssets(scene, objects, renderer) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/assets/studio/office.glb');
  const roots = gltf.scene.children.filter(node => node.userData.studio_id);
  for (const id of PROJECT_IDS) {
    if (!roots.some(root => root.userData.studio_id === id)) throw new Error(`Missing authored object: ${id}`);
  }
  gltf.scene.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    // Static shadows are baked. The cached runtime shadow pass contains movable props only.
    let ancestor = node;
    while (ancestor.parent && !PROJECT_IDS.has(ancestor.userData.studio_id)) ancestor = ancestor.parent;
    node.castShadow = PROJECT_IDS.has(ancestor.userData.studio_id);
    // Thin layered props otherwise self-shadow at sub-texel depth distances.
    // Their shape supplies the shading; cached cast shadows ground them on the desk.
    // The desk grounds movable props. Do not project those shadows through the
    // non-casting, already-baked desktop onto the room's floor and walls.
    node.receiveShadow = materials.some(material => material.userData.studio_bounce === 'desk');
    for (const material of materials) {
      if (material.userData.studio_bounce && material.map && material.isMeshStandardMaterial && node.geometry.attributes.uv1) {
        material.aoMap = null;
        material.color.set('#ffffff');
        const exposure = material.userData.studio_bounce === 'architecture' ? .72 : .87;
        const gain = (Number(material.userData.studio_bake_gain) || 1) * exposure;
        material.onBeforeCompile = shader => {
          shader.uniforms.studioBakeGain = { value: gain };
          shader.fragmentShader = 'uniform float studioBakeGain;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
          shader.fragmentShader = shader.fragmentShader.replace('vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;', 'vec3 outgoingLight = diffuseColor.rgb * studioBakeGain * (0.48 + 0.52 * getShadowMask()) + totalSpecular + totalEmissiveRadiance;');
        };
        material.customProgramCacheKey = () => 'studio-baked-diffuse-live-specular-v1';
      }
      if (material.userData.studio_screen) {
        // Genuine UI pixels stay readable instead of acquiring the room's colour cast.
        material.emissiveMap = material.map;
        material.emissive.set('#ffffff');
        material.emissiveIntensity = .65;
        material.color.set('#555555');
        material.roughness = .4;
      }
      if (material.userData.studio_photo) {
        material.emissiveMap = material.map;
        material.emissive.set('#ffffff');
        material.emissiveIntensity = .5;
        material.color.set('#777777');
      }
      if (material.name === 'Soft graphite keycaps') {
        material.color.set('#101715');
        material.roughness = .82;
      }
      for (const slot of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
        if (material[slot]) material[slot].anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      }
    }
  });

  const oldObjects = scene.children.filter(node => !node.isLight && !node.userData.keepStudio);
  const oldGeometry = new Set(), oldMaterials = new Set(), oldTextures = new Set();
  for (const root of oldObjects) {
    root.traverse(node => {
      if (node.geometry) oldGeometry.add(node.geometry);
      for (const material of node.material ? Array.isArray(node.material) ? node.material : [node.material] : []) {
        oldMaterials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) oldTextures.add(value);
      }
    });
    root.removeFromParent();
  }
  objects.clear();
  for (const root of roots) {
    const wrapper = new THREE.Group();
    wrapper.name = root.userData.studio_id;
    wrapper.position.copy(root.position).multiplyScalar(5);
    wrapper.quaternion.copy(root.quaternion);
    root.position.set(0, 0, 0);
    root.quaternion.identity();
    root.scale.multiplyScalar(5);
    wrapper.add(root);
    scene.add(wrapper);
    if (PROJECT_IDS.has(wrapper.name)) objects.set(wrapper.name, { group: wrapper, baseY: wrapper.position.y, hover: 0 });
  }
  for (const geometry of oldGeometry) geometry.dispose();
  for (const material of oldMaterials) material.dispose();
  for (const texture of oldTextures) texture.dispose();
  return gltf;
}
