"""Local PDF conversion with image assets, versioned cache and optional OCR."""
import argparse
import hashlib
from importlib.metadata import PackageNotFoundError, version
import json
import re
from pathlib import Path
import shutil
import subprocess
import tempfile

VERSION = '2.1.0'


def rewrite_images(markdown, mapping):
    """Change exact generated image destinations, never arbitrary asset text."""
    output = []
    fence = None
    pattern = re.compile(r'(!\[[^\]\n]*\]\()([^\n]*?)(\))')
    for line in markdown.splitlines(keepends=True):
        marker = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
            output.append(line)
            continue
        if fence:
            output.append(line)
            continue
        parts = re.split(r'(`+[^`\n]*`+)', line)
        for index in range(0, len(parts), 2):
            parts[index] = pattern.sub(
                lambda m: m.group(1) + mapping.get(m.group(2), m.group(2)) + m.group(3),
                parts[index])
        output.append(''.join(parts))
    return ''.join(output)


def asset_mapping(assets, destination):
    mapping = {}
    for image in assets.rglob('*'):
        if image.is_file():
            relative = image.relative_to(assets).as_posix()
            for source in (str(image), image.as_posix(), image.as_uri(), 'assets/' + relative):
                mapping[source] = destination + '/' + relative
    return mapping


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def dependency_versions():
    result = {}
    for name in ('pymupdf', 'pymupdf4llm', 'docling', 'docling-core', 'torch', 'transformers'):
        try:
            result[name] = version(name)
        except PackageNotFoundError:
            result[name] = None
    return result


def validate_ocr(languages):
    if not shutil.which('tesseract'):
        raise RuntimeError('Tesseract executable not found; install it separately')
    result = subprocess.run(['tesseract', '--list-langs'], capture_output=True,
                            text=True, check=True, timeout=30)
    available = set(result.stdout.splitlines())
    missing = set(languages) - available
    if missing:
        raise RuntimeError('Missing Tesseract languages: ' + ', '.join(sorted(missing)))
    return subprocess.run(['tesseract', '--version'], capture_output=True,
                          text=True, check=True, timeout=30).stdout.strip()


def valid_cache(cache):
    try:
        manifest = json.loads((cache / 'manifest.json').read_text())
        if not isinstance(manifest, dict) or not manifest or not {'document.md', 'report.json'}.issubset(manifest):
            return False
        for name, expected in manifest.items():
            path = cache / name
            if Path(name).is_absolute() or '..' in Path(name).parts or path.is_symlink():
                return False
            if not path.is_file() or digest(path) != expected:
                return False
        return True
    except (OSError, ValueError, TypeError):
        return False


def extract(source, stage, args):
    import pymupdf
    with pymupdf.open(source) as document:
        if document.needs_pass:
            raise RuntimeError('Encrypted PDF requires an unlocked local copy')
        pages = len(document)
        source_counts = [len(page.get_text().strip()) for page in document]
    assets = stage / 'assets'
    assets.mkdir()
    if args.engine == 'docling':
        from docling.document_converter import DocumentConverter, PdfFormatOption
        from docling.datamodel.base_models import InputFormat, ConversionStatus
        from docling.datamodel.pipeline_options import (
            PdfPipelineOptions, TableFormerMode, TesseractCliOcrOptions,
        )
        from docling_core.types.doc import ImageRefMode
        options = PdfPipelineOptions(do_ocr=args.ocr == 'tesseract',
                                     generate_picture_images=True)
        options.table_structure_options.mode = TableFormerMode.ACCURATE
        if args.ocr == 'tesseract':
            from docling.datamodel.pipeline_options import OcrMode
            options.ocr_options = TesseractCliOcrOptions(
                lang=args.languages.split('+'),
                mode=OcrMode.FULL_PAGE if args.force_ocr else OcrMode.DEFAULT,
            )
        converter = DocumentConverter(format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=options)
        })
        result = converter.convert(str(source))
        if result.status != ConversionStatus.SUCCESS:
            raise RuntimeError(f'Incomplete conversion: {result.status}')
        result.document.save_as_markdown(stage / 'document.md', artifacts_dir=assets,
                                        image_mode=ImageRefMode.REFERENCED)
        saved = (stage / 'document.md').read_text()
        image_links = re.findall(r'!\[[^\]\n]*\]\([^\n]*?\)', saved)
        pictures = list(result.document.pictures)
        if len(image_links) != len(pictures):
            raise RuntimeError('Image provenance mismatch; refusing ambiguous page mapping')
        page_markdown = []
        for number in range(1, pages + 1):
            text = result.document.export_to_markdown(
                page_no=number, image_mode=ImageRefMode.PLACEHOLDER)
            links = [link for picture, link in zip(pictures, image_links)
                     if any(prov.page_no == number for prov in picture.prov)]
            for link in links:
                if '<!-- image -->' not in text:
                    raise RuntimeError('Missing image placeholder in page export')
                text = text.replace('<!-- image -->', link, 1)
            page_markdown.append(text)
    else:
        import pymupdf4llm
        chunks = pymupdf4llm.to_markdown(
            str(source), table_strategy='lines_strict', show_progress=False,
            write_images=True, image_path=str(assets), page_chunks=True,
        )
        if len(chunks) != pages:
            raise RuntimeError('Page coverage mismatch')
        page_markdown = [chunk['text'] for chunk in chunks]
    report = {'total_pages': pages, 'engine': args.engine, 'pages': [],
              'limitations': 'Heuristic coverage, not proof of semantic fidelity.'}
    sections = []
    for number, text in enumerate(page_markdown, 1):
        warnings = []
        if not text.strip():
            warnings.append('empty-output-page')
        if source_counts[number - 1] > 100 and len(text.strip()) < source_counts[number - 1] * 0.4:
            warnings.append('possible-text-loss')
        if source_counts[number - 1] == 0:
            warnings.append('no-source-text-layer-review-image-or-ocr')
        report['pages'].append({'page': number, 'source_text_characters': source_counts[number - 1],
                                'markdown_characters': len(text.strip()), 'warnings': warnings})
        sections.append(f'<!-- PDF_PAGE: {number} -->\n\n' + text)
    markdown = rewrite_images('\n\n'.join(sections), asset_mapping(assets, 'assets'))
    (stage / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    if not markdown.strip():
        raise RuntimeError('Conversion produced empty Markdown')
    header = f'---\ntotal_pages: {pages}\nengine: {args.engine}\nocr: {args.ocr}\nconverter_version: {VERSION}\n---\n\n'
    (stage / 'document.md').write_text(header + markdown, encoding='utf-8')
    manifest = {str(p.relative_to(stage)): digest(p)
                for p in stage.rglob('*') if p.is_file()}
    (stage / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--engine', choices=('fast', 'docling'), default='fast')
    parser.add_argument('--ocr', choices=('none', 'tesseract'), default='none')
    parser.add_argument('--languages', default='eng+por')
    parser.add_argument('--force-ocr', action='store_true')
    parser.add_argument('--cache-dir', type=Path,
                        default=Path.home() / '.cache' / 'pdf-to-markdown')
    parser.add_argument('--no-cache', action='store_true')
    parser.add_argument('--clear-cache', action='store_true',
                        help='Invalidate only this input/settings cache entry')
    args = parser.parse_args()
    if not args.source.is_file():
        parser.error('Source PDF does not exist')
    if args.output.exists():
        parser.error('Output already exists; choose a new path')
    if args.ocr != 'none' and args.engine != 'docling':
        parser.error('Tesseract OCR requires --engine docling')
    if args.no_cache and args.clear_cache:
        parser.error('--no-cache cannot be combined with --clear-cache')
    if args.force_ocr and args.ocr != 'tesseract':
        parser.error('--force-ocr requires --ocr tesseract')
    args.output = args.output.resolve()
    assets_out = args.output.with_name(args.output.stem + '_images')
    report_out = args.output.with_suffix('.report.json')
    if report_out.exists():
        parser.error('Report already exists; choose a new output path')
    if assets_out.exists():
        parser.error('Image output directory already exists; choose a new output path')
    ocr_version = validate_ocr(args.languages.split('+')) if args.ocr == 'tesseract' else None
    settings = {'source': digest(args.source), 'version': VERSION,
                'dependencies': dependency_versions(), 'engine': args.engine,
                'ocr': args.ocr, 'languages': args.languages,
                'force_ocr': args.force_ocr, 'tesseract': ocr_version}
    key = hashlib.sha256(json.dumps(settings, sort_keys=True).encode()).hexdigest()
    cache = args.cache_dir / key
    if args.clear_cache and cache.exists():
        shutil.rmtree(cache)
    with tempfile.TemporaryDirectory(prefix='pdf-to-markdown-') as temporary:
        stage = Path(temporary)
        hit = not args.no_cache and valid_cache(cache)
        if hit:
            shutil.copytree(cache, stage, dirs_exist_ok=True)
        else:
            extract(args.source.resolve(), stage, args)
            if not args.no_cache:
                args.cache_dir.mkdir(parents=True, exist_ok=True)
                if cache.exists():
                    shutil.rmtree(cache)
                shutil.copytree(stage, cache)
        markdown = (stage / 'document.md').read_text()
        markdown = rewrite_images(markdown, asset_mapping(stage / 'assets', assets_out.name))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        # Exclusive creation prevents silently replacing an existing document.
        report_created = False
        with args.output.open('x', encoding='utf-8') as output:
            try:
                if any((stage / 'assets').iterdir()):
                    shutil.copytree(stage / 'assets', assets_out)
                with report_out.open('x', encoding='utf-8') as report_file:
                    report_created = True
                    report_file.write((stage / 'report.json').read_text())
                output.write(markdown)
            except Exception:
                args.output.unlink(missing_ok=True)
                if report_created:
                    report_out.unlink(missing_ok=True)
                if assets_out.exists():
                    shutil.rmtree(assets_out)
                raise
    report = json.loads(report_out.read_text())
    warnings = sum(len(page['warnings']) for page in report['pages'])
    print(f'Converted to {args.output}; cache={"hit" if hit else "miss"}; page_warnings={warnings}; report={report_out}')


if __name__ == '__main__':
    main()
