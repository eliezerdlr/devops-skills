# pdf-to-markdown

Complete local conversion workflow: fast PyMuPDF4LLM, advanced Docling tables, optional Tesseract OCR, extracted images with relative links, content-addressed cache and explicit fidelity checks. No document or model is bundled. Dependencies install only with user approval.

## Python installation (macOS/Linux)

Python 3.12 is the tested baseline. From this skill directory:

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pip check
```

On Windows use `py -3.12 -m venv .venv`, then `.venv\Scripts\python.exe` instead of `.venv/bin/python`. Linux/Windows are documented but not end-to-end tested here. Requirements pin tested direct versions, not a claim of newest releases or a universal lock. Do not upgrade blindly: test both engines and OCR, then update pins. Loading the skill never installs Python, tools or models.

## Tesseract (optional system executable, implemented in C++)

No Python Tesseract wrapper is needed: Docling invokes its CLI. Install only with approval.

macOS:

```bash
brew install tesseract tesseract-lang
```

`tesseract-lang` installs many languages and consumes substantial disk space. Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-eng tesseract-ocr-por
```

Windows: install a trusted Tesseract distribution following the upstream project's installation guidance; ensure the executable is on PATH and install English/Portuguese traineddata. Do not download arbitrary installers automatically.

```bash
tesseract --version
tesseract --list-langs
```

The default OCR language selection requires `eng` and `por`. Use `--languages eng` if only English is installed. If data files are not found, check the installation's `TESSDATA_PREFIX`. OCR data/models have separate licences.

## Conversion

```bash
# Digital text, no OCR
.venv/bin/python scripts/convert.py input.pdf output.md --engine fast
# Advanced layout/tables, no OCR
.venv/bin/python scripts/convert.py input.pdf advanced.md --engine docling
# Scanned/mixed document
.venv/bin/python scripts/convert.py scan.pdf scan.md --engine docling --ocr tesseract
# Force full-page OCR (can degrade existing digital text)
.venv/bin/python scripts/convert.py scan.pdf scan-full.md --engine docling --ocr tesseract --force-ocr --languages eng+por
```

Both engines export detected images to `<output-stem>_images/` with relative Markdown references. Keep that directory with the Markdown. Existing output files or asset directories are refused. Encrypted inputs require a separately unlocked copy; do not put passwords in command lines. Partial/empty conversion fails rather than silently reporting success.

Docling may download external model weights on first use. Document processing is local, but model downloads require network access. No fixed time/download size is promised. No cloud document-conversion API is used.

## Cache

Default: `~/.cache/pdf-to-markdown/`. Each entry is keyed by source SHA256, engine, OCR settings, converter version, key Python dependency versions and Tesseract version. Cached Markdown/assets are hash-checked before reuse. Source modifications invalidate the entry.

```bash
# No cache writes or reads (temporary staging is still used)
.venv/bin/python scripts/convert.py input.pdf private.md --no-cache
# Refresh only this input/settings entry
.venv/bin/python scripts/convert.py input.pdf refreshed.md --clear-cache
# Custom location
.venv/bin/python scripts/convert.py input.pdf custom.md --cache-dir /approved/cache
```

Cache contains document text and images: apply the same permissions/retention rules as the source. Models, OCR traineddata and every transitive library are not individually hashed: use `--clear-cache` after changing them. Cache writes are not concurrency-locked; avoid simultaneous writes for the same source/settings. Do not share a cache across untrusted users. Invalid/corrupt cache entries are regenerated. No automatic global cache deletion occurs.

## Page traceability and validation report

Every output includes `<!-- PDF_PAGE: N -->` markers and a sibling `<output-stem>.report.json`. The report records source-text and extracted-Markdown character counts for every page and warns about empty output, missing text layers and possible text loss (less than 40% of source text length for pages with over 100 source characters). These are heuristics, not detection of every omission, clipped command or semantic error. A blank page may legitimately trigger warnings; scan warnings require OCR/manual review. The report is included in cache integrity validation and cannot overwrite an existing report.

Image relocation changes only exact generated Markdown image destinations outside fenced/inline code, not arbitrary `assets/` text. Ambiguous Docling image/page mappings fail explicitly rather than guessing.

## Verification and troubleshooting

- Compare all pages, headings, tables, code and numbers with the PDF. Successful extraction does not prove fidelity.
- Review backslashes/newlines in commands; do not execute extracted commands automatically.
- Source-clipped content is not reliably recoverable. OCR can confuse punctuation and identifiers.
- Missing module: confirm the virtual environment and run `pip check`.
- Missing Tesseract/language: check PATH and `--list-langs`; the converter rejects missing requested languages.
- Bad layout: compare fast and Docling outputs, retaining both; inspect images manually.
- OCR orientation warnings on short pages may occur even when text is recovered: inspect the output.

## Tests

From the repository root, `node --test tests/pdf-to-markdown.test.mjs` runs offline contract/cache tests without optional engines. After approving dependencies and model downloads, run from this skill directory:

```bash
.venv/bin/python scripts/test_conversion.py -v
```

These real-engine tests create only temporary synthetic PDFs. They verify both engines, image links, cache hits, source-change invalidation, scanned-page OCR, a three-page technical fixture with columns/table/command paths and blank-page warnings. Offline regressions also check that image relocation leaves code and ordinary asset paths unchanged. OCR skips if Tesseract is absent; it requires English language data when present. They do not certify complex-table fidelity or all supported languages.

## Validation evidence and limits

macOS arm64/Python 3.12: both engines converted a synthetic PDF with an image; relative links existed; second conversions hit the cache. A scanned synthetic PDF was converted with Tesseract 5.5.4 and forced OCR, recovering its expected text. Tesseract emitted an orientation warning on this short sample. A separate real 10-page technical PDF was processed locally with all 10 page markers and 20 numbered sections retained; that private input/output is not bundled. This is not comprehensive OCR/language/table accuracy certification. Other platforms and complex real-world layouts need validation.

## Provenance and licences

The converter here is newly written integration code, not copied from the unverified external converter. Repository licensing applies to this code, not its dependencies/model weights. Review applicable PyMuPDF and other dependency licences before commercial embedding or redistribution. No private source documents, caches, environments or models should enter Git.
