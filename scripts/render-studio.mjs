import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const cache = process.env.STUDIO_SOURCE_CACHE || path.join(os.homedir(), '.cache', 'portfolio-tools');
const blender = process.env.STUDIO_BLENDER || path.join(cache, 'blender-4.5.9-windows-x64', 'blender.exe');
await access(blender).catch(() => { throw new Error('Set STUDIO_BLENDER to a Blender executable, or extract Blender 4.5.9 LTS into the portfolio-tools cache. See docs/STUDIO-PROTOTYPE.md.'); });
const child = spawn(blender, ['--background', '--python-exit-code', '1', '--python', path.resolve('scripts/create-studio.py'), '--', '--cache', cache, '--samples', '48'], { stdio: 'inherit', windowsHide: true });
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
