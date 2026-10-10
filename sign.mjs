// Fills in and signs a PDF as described by a job file.
//   node sign.mjs jobs/my-contract.json
//   node sign.mjs jobs/my-contract.json --date "October 9, 2026"
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { loadConfig, formatDate } from './config.mjs';

const args = process.argv.slice(2);
const jobFile = args.find(a => !a.startsWith('--'));
if (!jobFile) {
  console.error('usage: node sign.mjs <job.json> [--date "<text>"]');
  process.exit(1);
}
const dateArg = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;

const cfg = loadConfig();
const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
const values = { ...cfg, date: dateArg ?? job.date ?? formatDate(new Date(), cfg.dateFormat) };
const INK = rgb(...cfg.ink);

const out = job.output ?? path.join(path.dirname(job.input),
  `SIGNED - ${path.basename(job.input, path.extname(job.input))} - ${cfg.name}.pdf`);
if (path.resolve(out) === path.resolve(job.input)) {
  console.error('output would overwrite the original PDF; choose a different "output".');
  process.exit(1);
}

const doc = await PDFDocument.load(fs.readFileSync(job.input));
doc.registerFontkit(fontkit);
const hand = await doc.embedFont(fs.readFileSync(cfg.signatureFont), { subset: true });
const text = cfg.textFont
  ? await doc.embedFont(fs.readFileSync(cfg.textFont), { subset: true })
  : await doc.embedFont(StandardFonts.Helvetica);
const pages = doc.getPages();

for (const f of job.fields) {
  const p = pages[f.page - 1];
  if (!p) { console.error(`page ${f.page} does not exist (document has ${pages.length})`); process.exit(1); }
  const str = f.value.replace(/\{(\w+)\}/g, (_, k) => {
    if (values[k] == null) { console.error(`"{${k}}" is not set in config.json`); process.exit(1); }
    return values[k];
  });
  const sig = f.style === 'signature';
  const font = sig ? hand : text;
  const size = f.size ?? (sig ? 19 : 10.5);
  p.drawText(str, { x: f.x, y: f.y, size, font, color: INK });

  const end = f.x + font.widthOfTextAtSize(str, size);
  const fit = f.lineEnd == null ? '' : ` | line ends ${f.lineEnd} | ${end <= f.lineEnd ? 'FITS' : 'OVERFLOWS'}`;
  console.log(`p${f.page} ${sig ? 'signature' : 'text     '} x=${f.x} y=${f.y} ends ${end.toFixed(1)}${fit} :: ${JSON.stringify(str)}`);
}

fs.writeFileSync(out, await doc.save());
console.log('signed: ' + out);
