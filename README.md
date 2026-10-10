# Digital Media Autopen

A small Node.js workflow for filling in and signing PDF documents (contracts, waivers, codes of conduct) without printing, pen-signing and scanning them.

It finds the blank lines in a PDF, then writes your printed name, a handwriting-style signature, the date and any other details directly onto the page, and saves the result as a new `SIGNED - ...` file. The original PDF is never modified.

Your details live in one local file, `config.json`, and each document gets a short JSON "job" listing what goes where. Neither is committed to git, and neither are your PDFs.

> **What this is not:** the signature is typed text in a script font. It is not a cryptographic or certificate-based digital signature, and it does not prove who signed. Use it where a typed or drawn signature is accepted, and only to sign as yourself.

## How it works

A PDF page is a canvas with a coordinate system measured in points (1/72 inch), with the origin at the **bottom-left** corner. Signing a document is therefore two problems: finding where the blanks are, and drawing text there.

1. **Locate the blanks.** `coords.mjs` opens the PDF with [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist) and reads the text layer of every page. Each piece of text comes with its position, width and height. The script prints only the pieces that look like form fields: labels such as "Signature", "Date" or "Name", and runs of underscores (`_____`) that form the blank lines.
2. **Describe the fields.** You write a job file: a JSON list of fields, each with a page, an x/y position and a value such as `{name}` or `{date}`.
3. **Draw onto the page.** `sign.mjs` opens the PDF with [`pdf-lib`](https://www.npmjs.com/package/pdf-lib), replaces the `{placeholders}` with the values from `config.json`, and draws each field:
   - ordinary fields in Helvetica, 10.5 pt;
   - fields marked `"style": "signature"` in a handwriting font, embedded through [`@pdf-lib/fontkit`](https://www.npmjs.com/package/@pdf-lib/fontkit), 19 pt unless you set a size;
   - everything in a dark blue "pen ink" colour by default.
4. **Check the fit.** For every field, `sign.mjs` prints where the text ends. If you give the field a `lineEnd`, it also prints `FITS` or `OVERFLOWS`.
5. **Save a copy.** The result is written next to the original as `SIGNED - <document> - <your name>.pdf`.

## Files

| File | Purpose |
| --- | --- |
| `config.example.json` | Template for your personal details. Copy it to `config.json`. |
| `coords.mjs` | Prints the position of field labels and blank lines in one or more PDFs. |
| `sign.mjs` | Fills in and signs a PDF according to a job file. |
| `preview.mjs` | Generates `signature-font-options.pdf`, showing your name in several handwriting fonts so you can pick one. |
| `serve.mjs` | Tiny local file server on port 8731, for opening a signed PDF in a browser. |
| `config.mjs` | Shared helper that loads `config.json` and formats dates. |
| `examples/make-sample.mjs` | Generates `sample-contract.pdf`, a made-up agreement to practise on. |
| `examples/sample.job.json` | The job file that signs the sample. Use it as a template. |

Ignored by git, so they stay on your machine: `config.json`, everything in `jobs/` and `personal/`, and every `*.pdf`.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A handwriting font file (`.ttf` or `.otf`). The default is Segoe Script, which ships with Windows. On macOS or Linux, set `signatureFont` to a font you have.

## Setup

```sh
git clone https://github.com/squidhacks/Digital-Media-Autopen.git
cd Digital-Media-Autopen
npm install
cp config.example.json config.json
```

Then edit `config.json`:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "phone": "+1 (555) 555-0100",
  "signatureFont": "C:/Windows/Fonts/segoesc.ttf",
  "textFont": null,
  "ink": [0.06, 0.10, 0.44],
  "dateFormat": "MM/DD/YYYY"
}
```

| Key | Meaning |
| --- | --- |
| `name` | Required. Used for the printed name, the signature and the output file name. |
| `email`, `phone` | Optional. Available to jobs as `{email}` and `{phone}`. |
| *any other key* | Add whatever you need, for example `"studentId": "12345"`, and use it in a job as `{studentId}`. |
| `signatureFont` | Path to the handwriting font file. |
| `textFont` | Path to a font for ordinary fields, or `null` for Helvetica. Set this if your details contain characters outside Western European alphabets, which Helvetica cannot draw. |
| `ink` | Text colour as red, green, blue, each from 0 to 1. `[0, 0, 0]` is black. |
| `dateFormat` | How today's date is written. Tokens: `YYYY`, `MMMM` (October), `MMM` (Oct), `MM` (10), `M`, `DD` (09), `D` (9). For example `"MMMM D, YYYY"` gives "October 9, 2026". |

## Try it on the sample

```sh
node examples/make-sample.mjs            # writes sample-contract.pdf
node coords.mjs sample-contract.pdf      # shows where the blanks are
node sign.mjs examples/sample.job.json   # writes "SIGNED - sample-contract - Your Name.pdf"
```

Open the signed file. Your email, phone, name, signature and date are filled in, and the "Organisation President" line is still blank, because the job has no field for it.

## Signing your own document

### 1. Put the PDF in the project folder

Run every command from the project folder; file paths in jobs are relative to it.

### 2. (Once) pick a signature font

```sh
node preview.mjs
```

Open `signature-font-options.pdf`, choose one, and put its path in `config.json` as `signatureFont`. With no arguments the script tries seven fonts found on Windows. To try others, pass their paths:

```sh
node preview.mjs "/Library/Fonts/Snell Roundhand.ttf" "~/fonts/MySignature.otf"
```

### 3. Find the blanks

```sh
node coords.mjs "My Contract.pdf"
```

Example output:

```
p3 MB=[596x842] x=72.0  y=355.8 w=28.7 h=12.0 :: "Name"
p3 MB=[596x842] x=216.0 y=355.8 w=46.0 h=12.0 :: "Signature"
p3 MB=[596x842] x=360.0 y=355.8 w=22.7 h=12.0 :: "Date"
p3 MB=[596x842] x=72.0  y=324.1 w=96.0 h=12.0 :: "________________"
p3 MB=[596x842] x=216.0 y=324.1 w=96.0 h=12.0 :: "________________"
p3 MB=[596x842] x=360.0 y=324.1 w=96.0 h=12.0 :: "________________"
```

Reading a row: `p3` is the page, `MB` is the page size, `x` and `y` are the bottom-left corner of the text, and `w` is its width. So the signature line here is on page 3, starts at x=216, ends at x=312 (216 + 96), and sits at y=324.1.

If your document labels its fields differently, search for your own wording, or print everything:

```sh
node coords.mjs "My Contract.pdf" --match "initials|guardian"
node coords.mjs "My Contract.pdf" --all
```

### 4. Write the job file

Create `jobs/my-contract.json`:

```json
{
  "input": "My Contract.pdf",
  "fields": [
    { "page": 3, "x": 74,  "y": 327.4, "value": "{name}" },
    { "page": 3, "x": 216, "y": 327.4, "value": "{name}", "style": "signature", "size": 13, "lineEnd": 312 },
    { "page": 3, "x": 362, "y": 327.4, "value": "{date}" }
  ]
}
```

Job keys:

| Key | Meaning |
| --- | --- |
| `input` | The PDF to sign. |
| `output` | Optional. Defaults to `SIGNED - <input name> - <your name>.pdf` beside the input. |
| `date` | Optional. Fixed date text for this document, instead of today's date. |
| `fields` | The list of things to draw. |

Field keys:

| Key | Meaning |
| --- | --- |
| `page` | Page number, starting at 1. |
| `x`, `y` | Where the text starts, in points from the bottom-left of the page. |
| `value` | The text. `{name}`, `{date}` and any key from `config.json` are replaced; anything else is drawn as written, so `"None"` or `"X"` work too. |
| `style` | `"signature"` for the handwriting font. Leave it out for ordinary text. |
| `size` | Font size in points. Defaults to 19 for signatures and 10.5 for text. |
| `lineEnd` | Optional. The x where the blank line ends; turns on the `FITS` / `OVERFLOWS` check. |

Rules of thumb for the coordinates:

- **x**: use the line's `x`, or 2 pt to the right of it for printed text.
- **y**: add about 3 pt to the line's `y`. Underscores are drawn slightly below their baseline, so this makes the text rest on the line instead of cutting through it.
- **Fields after a label on the same row** (for example `Email: ____`): start a few points past where the label's own text ends.
- **Signature size**: start at 19 pt and reduce it until the field reports `FITS`. A 96 pt line fits roughly 13 pt for a 13-letter name.

Only list your own fields. Lines meant for someone else, such as a countersigning president or a witness, are left blank simply by not having a field.

### 5. Run it and check the result

```sh
node sign.mjs jobs/my-contract.json
```

```
p3 text      x=74 y=327.4 ends 145.8 :: "Your Name"
p3 signature x=216 y=327.4 ends 310.2 | line ends 312 | FITS :: "Your Name"
p3 text      x=362 y=327.4 ends 414.5 :: "10/09/2026"
signed: SIGNED - My Contract - Your Name.pdf
```

To use a different date for one run:

```sh
node sign.mjs jobs/my-contract.json --date "October 9, 2026"
```

Open the signed file and look at the signed page before sending it. To view it in a browser:

```sh
node serve.mjs
# then open http://localhost:8731/SIGNED%20-%20My%20Contract%20-%20Your%20Name.pdf
```

If something is a few points off, adjust the numbers in the job and run it again. It always starts from the untouched original, so re-running never stacks signatures.

## Limitations

- **Scanned PDFs** have no text layer, so `coords.mjs` finds nothing. You would have to work out coordinates by eye, using the page size and trial runs.
- **Blanks drawn as vector lines** rather than underscore characters do not appear in the output either. Use the nearby labels ("Signature", "Date") to estimate the position.
- **Fillable form fields** (AcroForms) are not filled in as fields; the text is drawn on top of the page.
- **Each document needs its own coordinates.** There is no automatic field matching; a new layout means a new job file.

## Privacy

`.gitignore` keeps `config.json`, `jobs/`, `personal/` and all PDFs out of the repository. If you fork this and add files elsewhere, check `git status` before you push so your details and documents do not go with it.
