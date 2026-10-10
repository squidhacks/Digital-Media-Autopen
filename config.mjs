import fs from 'fs';

const DEFAULTS = {
  signatureFont: 'C:/Windows/Fonts/segoesc.ttf',
  textFont: null,
  ink: [0.06, 0.10, 0.44],   // dark blue "pen"
  dateFormat: 'MM/DD/YYYY',
};

export function loadConfig(file = 'config.json') {
  if (!fs.existsSync(file)) {
    console.error(`${file} not found. Copy config.example.json to ${file} and fill in your details.`);
    process.exit(1);
  }
  const cfg = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  if (!cfg.name) { console.error(`${file}: "name" is required.`); process.exit(1); }
  return cfg;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];

// Tokens: YYYY, MMMM (October), MMM (Oct), MM (10), M, DD (09), D (9)
export function formatDate(d, fmt) {
  const pad = n => String(n).padStart(2, '0');
  const m = d.getMonth(), day = d.getDate();
  const parts = {
    YYYY: d.getFullYear(), MMMM: MONTHS[m], MMM: MONTHS[m].slice(0, 3),
    MM: pad(m + 1), M: m + 1, DD: pad(day), D: day,
  };
  return fmt.replace(/YYYY|MMMM|MMM|MM|M|DD|D/g, t => parts[t]);
}
