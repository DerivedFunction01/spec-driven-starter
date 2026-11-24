import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.content.estimates import scan

JUSTIFY = "the gate and bundle verification are serial by construction"


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def rules(findings):
    return sorted({finding.rule for finding in findings})


class EstimatesScannerTests(unittest.TestCase):
    def scan_tree(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            for relpath, text in files.items():
                write(tmp, relpath, text)
            return scan(Path(tmp))

    def test_step_heading_without_estimate_fails(self):
        plan = "# Plan\n\n### Step 1 — Build the thing\nfiles: a.py\nverify: gate\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])
        self.assertEqual(findings[0].line, 3)

    def test_steps_list_item_without_estimate_fails(self):
        plan = "# Plan\n\n## Steps\n\n1. **First** — build it.\n2. **Second** — gate it.\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])
        self.assertEqual(len(findings), 2)

    def test_todo_checkbox_without_estimate_fails(self):
        todo = "# Todos\n\n- [ ] Write the scanner\n- [x] Read the plan\n"
        findings = self.scan_tree({".plans/todos.md": todo})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])
        self.assertEqual(len(findings), 2)

    def test_todo_file_items_without_estimate_fail(self):
        findings = self.scan_tree({"TODO.md": "# Queue\n\n- Sweep the store\n"})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])

    def test_under_hour_estimates_pass(self):
        plan = (
            "# Plan\n\n## Steps\n\n"
            "1. **First** — build it. [est: 20m]\n"
            "2. **Second** — gate it. [est: 55m]\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_step_heading_with_estimate_passes(self):
        plan = "### Step 1 — Build [est: 45m]\nfiles: a.py\nverify: gate\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_exactly_one_hour_needs_no_justification(self):
        plan = "## Steps\n\n1. **Hour** — exactly. [est: 1h]\n2. **Hour** — spelled. [est: 60m]\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_over_hour_without_justification_fails(self):
        plan = (
            "## Steps\n\n"
            "1. **Long** — hours form. [est: 2h]\n"
            "2. **Long** — minutes form. [est: 90m]\n"
            "3. **Long** — combined form. [est: 1h30m]\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/unjustified-overrun"])
        self.assertEqual(len(findings), 3)

    def test_over_hour_with_justification_passes(self):
        plan = f"## Steps\n\n1. **Long** — rewrite. [est: 2h — {JUSTIFY}]\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_short_bracket_tail_is_not_justification(self):
        plan = "## Steps\n\n1. **Long** — rewrite. [est: 2h — later]\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/unjustified-overrun"])

    def test_each_long_duration_class_is_accepted(self):
        justifications = [
            "floored by a serial dependency: the bundle verifies after the gate",
            "cpu-bound at the full worker count on both sessions",
            "memory-bandwidth is the ceiling: the census streams the snapshot twice",
            "io-bound on the snapshot read; the disk is the ceiling throughout",
            "capacity queueing on the two live sessions sets the floor",
            "network-held: the transfer waits on the link, not on compute",
            "coordination and fan-in across six lanes; tail latency sets the floor",
            "an algorithmic complexity floor: the solve is quadratic in the cohort",
            "the critic and verification runs over the rendered surface set the floor",
            "browser work: the flow is driven by hand through the live console",
            "a real-time observation window: the soak is watched for a full cycle",
        ]
        for justification in justifications:
            with self.subTest(justification=justification):
                plan = (
                    f"## Steps\n\n1. **Long** — work. "
                    f"[est: 2h — {justification}]\n"
                )
                findings = self.scan_tree({".plans/plan.md": plan})
                self.assertEqual(findings, [])

    def test_long_justification_naming_no_class_fails(self):
        plan = (
            "## Steps\n\n1. **Long** — rewrite. [est: 2h — the work is simply "
            "very large and touches many files across the whole tree]\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/unclassed-overrun"])

    def test_invalid_form_justification_fails(self):
        plan = (
            "## Steps\n\n1. **Long** — waits. [est: 2h — polling intervals "
            "while sessions free up]\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/unclassed-overrun"])

    def test_serial_by_default_names_no_class(self):
        plan = (
            "## Steps\n\n1. **Long** — serial. [est: 2h — serial-by-default "
            "execution, one lane after another]\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/unclassed-overrun"])

    def test_unparseable_estimate_fails(self):
        plan = "## Steps\n\n1. **Blocked** — waits. [est: their landing + 15m]\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])

    def test_fenced_example_estimates_are_masked(self):
        plan = (
            "# Plan\n\n## Steps\n\n"
            "1. **First** — build it. [est: 20m]\n\n"
            "Example of the old form:\n\n```\n1. **Old** — no marker.\n```\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_code_span_estimate_is_masked(self):
        plan = "## Steps\n\n1. **First** — write `[est: 20m]` in the file.\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])

    def test_open_question_checkbox_needs_no_estimate(self):
        plan = (
            "# Plan\n\n## Steps\n\n1. **First** — build it. [est: 20m]\n\n"
            "## Open questions\n\n- [ ] Which venue runs it?\n"
        )
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertEqual(findings, [])

    def test_finished_plan_archive_passes(self):
        plan = "# Old plan\n\n## Steps\n\n1. **First** — no marker, long landed.\n"
        findings = self.scan_tree({".plans/finished/old.md": plan})
        self.assertEqual(findings, [])

    def test_plan_file_with_no_entries_fails(self):
        findings = self.scan_tree({".plans/notes.md": "# Notes\n\nProse only.\n"})
        self.assertEqual(rules(findings), ["estimates/missing-estimate"])
        self.assertEqual(findings[0].line, 1)

    def test_non_plan_doc_is_outside_population(self):
        doc = "# Guide\n\n1. **First** — a doc list item, not a step.\n"
        findings = self.scan_tree({"docs/guide.md": doc})
        self.assertEqual(findings, [])

    def test_enforcement_plan_in_miniature_passes(self):
        plan = (
            "# Estimate rule — system enforcement build\n\n"
            "## Steps\n\n"
            "1. **Spec text** — the rule enters the supervision rules. [est: 20m]\n"
            "2. **Estimate lint (starter gate)** — a scanner in the starter's "
            "own form. [est: 55m — the template scanner carries the population, "
            "masking, and registration mechanics]\n"
            "3. **Gate and land** — landings serial, ancestry verified. [est: 45m]\n"
        )
        findings = self.scan_tree({".plans/2026-11-24-estimate-rule.md": plan})
        self.assertEqual(findings, [])

    def test_findings_never_print_matched_content(self):
        plan = "## Steps\n\n1. **SecretStepName** — no marker.\n"
        findings = self.scan_tree({".plans/plan.md": plan})
        self.assertTrue(findings)
        for finding in findings:
            self.assertNotIn("SecretStepName", finding.message)


def git(root, *args):
    subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "-c",
            "user.email=test@example.com",
            "-c",
            "user.name=Test",
            *args,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


@unittest.skipUnless(shutil.which("git"), "git not on PATH")
class EstimatesTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_files_are_scanned(self):
        plan = "## Steps\n\n1. **First** — no marker.\n"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, ".plans/tracked.md", plan)
            git(root, "add", ".plans/tracked.md")
            git(root, "commit", "-q", "-m", "seed")
            write(root, ".plans/untracked.md", plan)
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {".plans/tracked.md"})
            git(root, "add", ".plans/untracked.md")
            findings = scan(root)
            self.assertEqual(
                {f.path for f in findings},
                {".plans/tracked.md", ".plans/untracked.md"},
            )


if __name__ == "__main__":
    unittest.main()
