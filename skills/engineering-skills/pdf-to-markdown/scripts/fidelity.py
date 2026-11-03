"""Conservative PDF text-layer recovery. Never synthesizes missing arguments."""
from difflib import SequenceMatcher
import re


def compact(text):
    return ''.join(text.split())


def technical_regions(page):
    """Collect contiguous monospaced lines; keep PDF reading order and x indentation.

    This is a text-layer heuristic, not OCR or a general layout reconstruction.
    PDF tabs are not recoverable; indentation is estimated from glyph positions.
    """
    regions = []
    pending = []

    def flush():
        if not pending:
            return
        left = min(line['x'] for line in pending)
        text = '\n'.join(' ' * max(0, round((line['x'] - left) / line['space']))
                         + line['text'] for line in pending)
        warnings = []
        if any(line['right'] >= page.rect.width - 2 for line in pending):
            warnings.append('possible-right-edge-clipping')
        # Quotes/delimiters are diagnostics only; never auto-close them.
        if text.count('"') % 2 or text.count("'") % 2:
            warnings.append('unbalanced-quotes-review-source')
        if text.count('{') != text.count('}') or text.count('[') != text.count(']'):
            warnings.append('unbalanced-delimiters-or-page-continuation')
        regions.append({'text': text, 'warnings': warnings,
                        'bbox': [left, pending[0]['y'], max(l['right'] for l in pending), pending[-1]['bottom']]})
        pending.clear()

    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            spans = [s for s in line['spans'] if s['text'].strip()]
            mono = spans and all(s.get('flags', 0) & 8 or
                                any(f in s.get('font', '').lower() for f in ('mono', 'courier', 'consolas'))
                                for s in spans)
            if not mono:
                flush()
                continue
            bbox = line['bbox']
            if pending and (bbox[1] < pending[-1]['y'] or
                            bbox[1] - pending[-1]['bottom'] > max(8, spans[0]['size'])):
                flush()
            pending.append({'text': ''.join(s['text'] for s in line['spans']).rstrip(),
                            'x': bbox[0], 'y': bbox[1], 'right': bbox[2], 'bottom': bbox[3],
                            'space': max(1, spans[0]['size'] * 0.6)})
    flush()
    return regions


def restore_code(markdown, regions):
    """Match fenced blocks to unique source regions, recording every decision."""
    records = []
    used = set()
    fence = re.compile(r'(?m)^(`{3,}|~{3,})([^\n]*)\n(.*?)^\1[ \t]*$', re.S)

    def replace(match):
        original = match.group(3).rstrip('\n')
        candidates = []
        for start in range(len(regions)):
            for end in range(start + 1, min(len(regions), start + 12) + 1):
                indices = list(range(start, end))
                if any(i in used for i in indices):
                    continue
                joined = '\n\n'.join(regions[i]['text'] for i in indices)
                score = SequenceMatcher(None, compact(original), compact(joined), autojunk=False).ratio()
                candidates.append((score, indices, joined))
        candidates.sort(key=lambda candidate: candidate[0], reverse=True)
        ambiguous = len(candidates) > 1 and (
            candidates[0][0] == candidates[1][0] or
            (candidates[0][0] < 1 and candidates[0][0] - candidates[1][0] < 0.05))
        if not candidates or candidates[0][0] < 0.85 or ambiguous:
            records.append({'status': 'unverified-code-block', 'warnings': ['ambiguous-or-no-source-match']})
            return match.group(0) + '\n\n> **Conversion warning:** code formatting could not be verified against the PDF text layer; review the original.\n'
        score, indices, text = candidates[0]
        used.update(indices)
        warnings = sorted({warning for i in indices for warning in regions[i]['warnings']})
        records.append({'status': 'source-lines-restored', 'similarity': round(score, 4),
                        'source_regions': indices, 'bboxes': [regions[i]['bbox'] for i in indices],
                        'warnings': warnings})
        marker = '`' * max(3, max((len(s) + 1 for s in re.findall(r'`+', text)), default=3))
        output = marker + match.group(2) + '\n' + text + '\n' + marker
        if warnings:
            output += '\n\n> **Conversion warning:** possible clipped/incomplete code or page continuation; source lines preserved without completing missing text. Review the original.\n'
        return output

    # Some engines emit one fence per source line. Coalesce adjacent blocks
    # before matching; no prose or image between them may be crossed.
    matches = list(fence.finditer(markdown))
    groups = []
    for match in matches:
        if groups and not markdown[groups[-1][-1].end():match.start()].strip() and (
                match.group(2).strip() == groups[-1][-1].group(2).strip()):
            groups[-1].append(match)
        else:
            groups.append([match])
    for group in reversed(groups):
        if len(group) > 1:
            body = '\n'.join(m.group(3).rstrip('\n') for m in group)
            merged = group[0].group(1) + group[0].group(2) + '\n' + body + '\n' + group[0].group(1)
            markdown = markdown[:group[0].start()] + merged + markdown[group[-1].end():]
    result = fence.sub(replace, markdown)
    unmatched = [i for i in range(len(regions)) if i not in used and (
        '\n' in regions[i]['text'] or '\\' in regions[i]['text'] or
        '=' in regions[i]['text'] or len(regions[i]['text'].split()) > 1)]
    if unmatched:
        # Do not silently discard a source code region just because the backend
        # misclassified it as prose or assigned it to the wrong page.
        excerpts = '\n\n'.join(regions[i]['text'] for i in unmatched)
        marker = '`' * max(3, max((len(s) + 1 for s in re.findall(r'`+', excerpts)), default=3))
        result += ('\n\n> **Conversion warning — source excerpt:** monospaced text below '
                   'could not be aligned with the extracted structure. It belongs to this PDF page; '
                   'the backend text above may duplicate or misplace it. Review the original.\n\n'
                   + marker + 'text\n' + excerpts + '\n' + marker + '\n')
        for index in unmatched:
            records.append({'status': 'unmatched-source-region-preserved', 'source_region': index,
                            'bbox': regions[index]['bbox'],
                            'warnings': ['review-source-code-coverage'] + regions[index]['warnings']})
    return result, records
