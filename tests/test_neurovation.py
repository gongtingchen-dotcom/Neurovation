"""Tests for the Neurovation pages. The original trialmatch tests live in test_core.py and are unchanged."""
import hashlib
import subprocess
import sys
from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

PAGES = sorted((ROOT / "pages").glob("*.py"))


@pytest.mark.parametrize("page", PAGES, ids=lambda p: p.stem)
def test_page_renders_without_error(page):
    at = AppTest.from_file(str(page), default_timeout=30).run()
    assert not at.exception, at.exception


def test_simulated_progress_fills_every_stage():
    at = AppTest.from_file(str(ROOT / "pages" / "3_Dashboard.py"), default_timeout=30).run()
    at.button(key="simulate").click().run()
    assert not at.exception
    metrics = {m.label: m.value for m in at.metric}
    assert int(metrics["Identified"]) == 20
    assert int(metrics["Approved for contact"]) > 0
    assert int(metrics["Enrolled"]) > 0
    assert len(at.session_state["nv_audit"]) > 0


def test_only_pi_can_approve():
    at = AppTest.from_file(str(ROOT / "pages" / "1_Review_and_approve.py"), default_timeout=30).run()
    approve = next(b for b in at.button if b.label == "Approve for contact")
    assert approve.disabled  # default role is research officer


def test_assistant_refuses_identity_for_research_officer():
    from neurovation import assistant

    at = AppTest.from_file(str(ROOT / "pages" / "4_Study_assistant.py"), default_timeout=30).run()
    at.chat_input[0].set_value("What is the name of PT-101?").run()
    assert not at.exception
    assert any("cannot see identifying information" in w.value for w in at.warning)
    assert assistant.SUGGESTIONS


def test_original_module_files_unchanged():
    """The Neurovation work must not modify the protocol-matching module or its data."""
    protected = ["trialmatch", "data", "scripts", "tests/test_core.py", "requirements.txt"]
    diff = subprocess.run(["git", "diff", "--name-only", "origin/main", "--", *protected], cwd=ROOT, capture_output=True, text=True)
    if diff.returncode != 0:
        pytest.skip("git history not available")
    assert diff.stdout.strip() == "", f"Protected files changed: {diff.stdout}"


def test_app_py_only_gains_the_role_picker():
    """app.py may only gain the two marked lines that add the shared 'Signed in as' sidebar block."""
    diff = subprocess.run(["git", "diff", "-U0", "origin/main", "--", "app.py"], cwd=ROOT, capture_output=True, text=True)
    if diff.returncode != 0:
        pytest.skip("git history not available")
    changed = [l for l in diff.stdout.splitlines() if l[:1] in "+-" and not l.startswith(("+++", "---"))]
    assert all(l.startswith("+") and "Neurovation" in l for l in changed), changed
    assert len(changed) == 2, changed
