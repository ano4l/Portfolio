import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const cache = process.env.STUDIO_SOURCE_CACHE || path.join(os.homedir(), '.cache', 'portfolio-tools');
async function fetchFile(record, target) {
  try {
    const cached = await readFile(target);
    if (createHash('md5').update(cached).digest('hex') === record.md5) return;
  } catch {}
  const response = await fetch(record.url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Asset download failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('md5').update(bytes).digest('hex') !== record.md5) throw new Error('Asset checksum mismatch');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
async function manifest(id) {
  const response = await fetch(`https://api.polyhaven.com/files/${id}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Poly Haven manifest unavailable (${response.status})`);
  return response.json();
}
const wood = await manifest('smoked_walnut_veneer');
for (const channel of ['Diffuse', 'nor_gl', 'Rough']) {
  await fetchFile(wood[channel]['1k'].jpg, path.join(cache, 'materials', `walnut-${channel}.jpg`));
}
const lamp = (await manifest('desk_lamp_arm_01')).gltf['1k'].gltf;
await fetchFile(lamp, path.join(cache, 'lamp', 'lamp.gltf'));
for (const [name, record] of Object.entries(lamp.include)) await fetchFile(record, path.join(cache, 'lamp', name));
console.log(`Verified CC0 studio sources in ${cache}`);
