"""Offline exact-string regressions for technical blocks."""
import unittest
from fidelity import restore_code


def region(text, warnings=None):
    return {'text': text, 'warnings': warnings or [], 'bbox': [0, 0, 100, 100]}


class FidelityTests(unittest.TestCase):
    def test_multiple_commands_and_continuations_exact(self):
        first = 'tool inspect \\\n  --region example \\\n  --query \'Items[0].{Name:Name}\''
        second = 'tool events \\\n  --duration 60'
        source = [region(first), region(second)]
        flat = '```bash\n' + (first + ' ' + second).replace('\n', ' ') + '\n```'
        result, records = restore_code(flat, source)
        self.assertEqual(result, '```bash\n' + first + '\n\n' + second + '\n```')
        self.assertEqual(records[0]['status'], 'source-lines-restored')

    def test_incomplete_source_not_completed(self):
        text = 'tool --query \'Items[0].{Name:Na'
        result, records = restore_code('```\n' + text + '\n```',
                                       [region(text, ['unbalanced-quotes-review-source'])])
        self.assertIn(text + '\n```', result)
        self.assertIn('Conversion warning', result)
        self.assertEqual(records[0]['warnings'], ['unbalanced-quotes-review-source'])

    def test_ambiguous_identical_regions_not_guessed(self):
        text = 'tool status'
        result, records = restore_code('```\n' + text + '\n```', [region(text), region(text)])
        self.assertEqual(records[0]['status'], 'unverified-code-block')
        self.assertIn('could not be verified', result)

    def test_missing_text_layer_is_not_reconstructed(self):
        result, records = restore_code('```\nunknown command\n```', [])
        self.assertIn('unknown command', result)
        self.assertEqual(records[0]['status'], 'unverified-code-block')

    def test_multiline_hcl_indentation_exact(self):
        text = 'resource "example" "test" {\n  enabled = true\n}'
        result, _ = restore_code('```hcl\nresource "example" "test" { enabled = true }\n```', [region(text)])
        self.assertEqual(result, '```hcl\n' + text + '\n```')


if __name__ == '__main__':
    unittest.main()
