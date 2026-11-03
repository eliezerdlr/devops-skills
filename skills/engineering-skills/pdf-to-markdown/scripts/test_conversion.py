"""Optional real-engine tests. Run only after approved dependency/model setup."""
from pathlib import Path
import re
import json
import shutil
import subprocess
import sys
import tempfile
import unittest


class ConversionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.cli = Path(__file__).with_name('convert.py')

    def convert(self, source, output, *options):
        result = subprocess.run(
            [sys.executable, str(self.cli), str(source), str(output),
             '--cache-dir', str(self.root / 'cache'), *options],
            capture_output=True, text=True, timeout=180,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout

    def test_engines_images_cache_and_source_invalidation(self):
        import pymupdf
        from PIL import Image
        image = self.root / 'figure.png'
        Image.new('RGB', (200, 100), 'red').save(image)
        source = self.root / 'sample.pdf'
        document = pymupdf.open()
        page = document.new_page()
        page.insert_text((72, 72), 'Generic conversion test')
        page.insert_image(pymupdf.Rect(72, 120, 272, 220), filename=str(image))
        document.save(source)
        document.close()
        for engine in ('fast', 'docling'):
            for index in range(2):
                output = self.root / f'{engine}-{index}.md'
                status = self.convert(source, output, '--engine', engine)
                self.assertIn('cache=hit' if index else 'cache=miss', status)
                markdown = output.read_text()
                self.assertIn('Generic conversion test', markdown)
                links = re.findall(r'!\[[^\]]*\]\(([^)]+)\)', markdown)
                self.assertTrue(links)
                for link in links:
                    self.assertFalse(Path(link).is_absolute())
                    self.assertTrue((self.root / link).is_file())
        # Change the bytes while retaining valid PDF syntax.
        with source.open('ab') as stream:
            stream.write(b'\n% cache invalidation test\n')
        self.assertIn('cache=miss', self.convert(source, self.root / 'changed.md'))

    def test_multipage_table_commands_and_blank_page_report(self):
        import pymupdf
        source = self.root / 'technical.pdf'
        doc = pymupdf.open()
        first = doc.new_page()
        first.insert_text((72, 72), 'Technical validation document', fontsize=18)
        first.insert_text((72, 110), 'Command: cp assets/config.json output.json')
        first.insert_textbox(pymupdf.Rect(72, 150, 260, 300),
                             'LEFT COLUMN validation. Preserve identifiers and numbers.')
        first.insert_textbox(pymupdf.Rect(300, 150, 500, 300),
                             'RIGHT COLUMN validation. Compare the original PDF.')
        second = doc.new_page()
        second.insert_text((72, 72), 'Configuration table')
        for x in (72, 250, 450):
            second.draw_line((x, 100), (x, 220))
        for y in (100, 140, 180, 220):
            second.draw_line((72, y), (450, y))
        for x, y, text in [(80, 125, 'Parameter'), (260, 125, 'Value'),
                           (80, 165, 'timeout_seconds'), (260, 165, '30'),
                           (80, 205, 'retry_count'), (260, 205, '3')]:
            second.insert_text((x, y), text)
        doc.new_page()
        doc.save(source)
        doc.close()
        for engine in ('fast', 'docling'):
            output = self.root / f'technical-{engine}.md'
            self.convert(source, output, '--engine', engine)
            markdown = output.read_text()
            self.assertIn('assets/config.json', markdown)
            self.assertIn('timeout', markdown)
            self.assertIn('30', markdown)
            self.assertIn('LEFT COLUMN', markdown)
            self.assertIn('RIGHT COLUMN', markdown)
            self.assertEqual(markdown.count('<!-- PDF_PAGE:'), 3)
            report = json.loads(output.with_suffix('.report.json').read_text())
            self.assertEqual([p['page'] for p in report['pages']], [1, 2, 3])
            self.assertIn('empty-output-page', report['pages'][2]['warnings'])

    @unittest.skipUnless(shutil.which('tesseract'), 'Tesseract not installed')
    def test_scanned_pdf_ocr(self):
        from PIL import Image, ImageDraw, ImageFont
        image = Image.new('RGB', (1600, 1000), 'white')
        font = ImageFont.load_default(size=48)
        ImageDraw.Draw(image).text((100, 180), 'Generic OCR validation document',
                                  font=font, fill='black')
        source = self.root / 'scan.pdf'
        image.save(source, 'PDF', resolution=150)
        output = self.root / 'scan.md'
        self.convert(source, output, '--engine', 'docling', '--ocr', 'tesseract',
                     '--languages', 'eng', '--force-ocr', '--no-cache')
        self.assertIn('Generic OCR validation', output.read_text())


if __name__ == '__main__':
    unittest.main()
