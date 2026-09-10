// Copia /out (lo que genera `next build`) a /public_html, listo para subir
// tal cual a Hostinger. Usa fs.cpSync (Node nativo) en vez de `cp`/`xcopy`
// para que funcione igual en PowerShell, cmd o Git Bash — no depende del
// shell desde donde se corra `npm run build:hostinger`.
import { existsSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'out');
const dest = path.join(root, 'public_html');

if (!existsSync(src)) {
  console.error('No existe /out — corre "npm run build" primero.');
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true });
console.log(`Listo: ${dest}`);
console.log('Sube TODO lo que hay adentro de public_html/ a la carpeta public_html de Hostinger.');
