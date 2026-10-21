// Static integrity check of the deploy folder: every local asset referenced from index.html and the JS/CSS
// bundles exists in public/, and no PHP or secrets are being published. Usage: npm run check
const fs = require('node:fs');
const path = require('node:path');

const pub = path.resolve(__dirname, '..', 'public');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(pub);
const rel = new Set(files.map((f) => '/' + path.relative(pub, f).split(path.sep).join('/')));

let problems = 0;
const fail = (m) => { problems++; console.error('FAIL ' + m); };

for (const f of files) {
  if (/\.(php|htaccess)$/i.test(f) || path.basename(f) === '.htaccess') fail('server-side file would be published: ' + f);
  if (/\.(html|js|css|json|php)$/i.test(f) && /xkeysib-[0-9a-f]{20,}/.test(fs.readFileSync(f, 'utf8'))) fail('Brevo API key found in ' + f);
}

const missing = new Set();
const exts = 'png|jpe?g|webp|avif|svg|webm|mp4|css|js|ico';
const re = new RegExp('[`"\'(](/(?:[A-Za-z0-9_%.\\- ]+/)*[A-Za-z0-9_%.\\- ]+\\.(?:' + exts + '))(?=[`"\')?#])', 'g');
let checked = 0;
for (const f of files.filter((x) => /\.(html|js|css)$/.test(x))) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(re)) {
    const p = decodeURIComponent(m[1]);
    checked++;
    if (!rel.has(p)) missing.add(`${p}  (referenced in ${path.relative(pub, f)})`);
  }
}
missing.forEach((m) => fail('missing ' + m));
console.log(`${files.length} files in public/, ${checked} asset references checked, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
