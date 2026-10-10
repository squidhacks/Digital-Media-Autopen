// Prints the position of field labels and blank lines in one or more PDFs.
//   node coords.mjs "My Contract.pdf"
//   node coords.mjs "My Contract.pdf" --match "initials|witness"
//   node coords.mjs "My Contract.pdf" --all
import fs from 'fs';
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const args = process.argv.slice(2);
let match = /name|signature|signed|date|email|phone|address|initial|witness|_{3,}/i;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--all') match = /./;
  else if (args[i] === '--match') match = new RegExp(args[++i], 'i');
  else files.push(args[i]);
}
if (!files.length) {
  console.error('usage: node coords.mjs <file.pdf> [more.pdf ...] [--match <regex> | --all]');
  process.exit(1);
}

for (const file of files) {
  console.log('\n===== ' + file + ' =====');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false, verbosity: 0 }).promise;
  console.log('pages:', doc.numPages);
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      if (!match.test(it.str)) continue;
      const [a,b,c,d,e,f] = it.transform;
      console.log(`p${p} MB=[${vp.width.toFixed(0)}x${vp.height.toFixed(0)}] x=${e.toFixed(1)} y=${f.toFixed(1)} w=${it.width.toFixed(1)} h=${it.height.toFixed(1)} :: ${JSON.stringify(it.str)}`);
    }
  }
}
