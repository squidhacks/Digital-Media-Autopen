// Writes sample-contract.pdf, a made-up two-party agreement to practise on.
//   node examples/make-sample.mjs
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const doc = await PDFDocument.create();
const page = doc.addPage([612, 792]);
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const put = (s, x, y, f = font, size = 11) => page.drawText(s, { x, y, size, font: f });

put('Sample Volunteer Agreement', 72, 720, bold, 16);
put('This is a made-up document for trying out the signing workflow.', 72, 690);
put('The Volunteer agrees to attend scheduled meetings and to respond', 72, 660);
put('to messages within a reasonable time.', 72, 644);

put('Email: ______________________________', 72, 590);
put('Phone: ______________________________', 72, 566);

put('________________________', 72, 480);
put('Organisation President', 72, 464);

put('Name', 72, 400);
put('Signature', 230, 400);
put('Date', 420, 400);
put('____________________', 72, 370);
put('__________________________', 230, 370);
put('________________', 420, 370);

fs.writeFileSync('sample-contract.pdf', await doc.save());
console.log('ok: sample-contract.pdf');
