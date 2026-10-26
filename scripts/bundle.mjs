import { build } from 'esbuild';
await build({entryPoints:['src/office.js'],bundle:true,minify:true,format:'esm',target:'es2022',outfile:'public/office.js'});
