// Writes signature-font-options.pdf: your name in several handwriting fonts.
//   node preview.mjs
//   node preview.mjs "/path/to/MyFont.ttf" "/path/to/Other.otf"
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.mjs';

const { name } = loadConfig();

const F = 'C:/Windows/Fonts/';
const WINDOWS = ['segoesc.ttf', 'LHANDW.TTF', 'BRUSHSCI.TTF', 'MISTRAL.TTF',
                 'FRSCRIPT.TTF', 'Inkfree.ttf', 'Gabriola.ttf'].map(f => F + f);
const given = process.argv.slice(2);
const fonts = given.length ? given : WINDOWS;

const doc = await PDFDocument.create();
doc.registerFontkit(fontkit);
const page = doc.addPage([612, 792]);
const helv = await doc.embedFont('Helvetica');

page.drawText('Signature font options', { x: 50, y: 740, size: 14, font: helv });

let y = 690, n = 0;
for (const file of fonts) {
  try {
    const f = await doc.embedFont(fs.readFileSync(file), { subset: true });
    page.drawText(`${++n}. ${file}`, { x: 50, y, size: 9, font: helv, color: rgb(0.45,0.45,0.45) });
    page.drawText(name, { x: 70, y: y - 34, size: 26, font: f, color: rgb(0.05,0.05,0.4) });
    page.drawLine({ start:{x:70,y:y-42}, end:{x:340,y:y-42}, thickness:0.5, color: rgb(0.7,0.7,0.7) });
    y -= 90;
  } catch (e) { console.log('skipped', path.basename(file), '-', e.message); }
}
if (!n) { console.error('no fonts could be loaded; pass font file paths as arguments.'); process.exit(1); }
fs.writeFileSync('signature-font-options.pdf', await doc.save());
console.log(`ok: ${n} font(s) -> signature-font-options.pdf`);
