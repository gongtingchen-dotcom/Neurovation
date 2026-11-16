"""Build data/sample_protocol_NCT00056563.pdf, a TEST FIXTURE (not the original protocol).

The eligibility wording follows the public ClinicalTrials.gov record NCT00056563
(VA CSP #468, DBS vs best medical therapy). Check it against the live record before quoting it.
"""
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer

INCLUSION = [
    "idiopathic Parkinson's disease",
    'Hoehn and Yahr stage 2 or worse "off" medications',
    "on stable medical therapy for at least one month prior to enrollment",
    "age > 21",
    "available and willing to be followed-up according to study protocol",
    "no intracranial abnormalities that would contraindicate surgery (based on pre-operative magnetic resonance imaging of the brain)",
]
EXCLUSION = [
    '"Parkinson\'s plus" syndromes',
    "medical contraindications to surgery or stimulation",
    "active alcohol or drug abuse",
    "score on minimental status exam 24 or lower, or other neuropsychological dysfunction (e.g., dementia) that would contraindicate surgery",
    "concurrent participation in another research protocol",
]


def main(out: Path):
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(str(out), pagesize=A4, title="Test fixture protocol summary")
    story = [
        Paragraph("Deep Brain Stimulation (DBS) vs. Best Medical Therapy (BMT) in Parkinson's Disease", styles["Title"]),
        Paragraph(
            "TEST FIXTURE. Eligibility wording follows the public ClinicalTrials.gov record "
            "NCT00056563. This file is not the original study protocol.",
            styles["Italic"],
        ),
        Spacer(1, 14),
        Paragraph("Study design", styles["Heading2"]),
        Paragraph(
            "Randomised comparison of bilateral deep brain stimulation against best medical therapy "
            "in patients with Parkinson's disease.",
            styles["BodyText"],
        ),
        Spacer(1, 10),
        Paragraph("Eligibility", styles["Heading2"]),
        Paragraph("Inclusion Criteria:", styles["Heading3"]),
        ListFlowable([ListItem(Paragraph(t, styles["BodyText"])) for t in INCLUSION], bulletType="bullet"),
        Spacer(1, 8),
        Paragraph("Exclusion Criteria:", styles["Heading3"]),
        ListFlowable([ListItem(Paragraph(t, styles["BodyText"])) for t in EXCLUSION], bulletType="bullet"),
    ]
    doc.build(story)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    main(root / "data" / "sample_protocol_NCT00056563.pdf")
    print("wrote fixture PDF")
