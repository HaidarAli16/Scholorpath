from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "CandidRoute_Student_Funnel_Printable.pdf"

NAVY = HexColor("#0B1F4D")
BLUE = HexColor("#246BFD")
BLUE_LIGHT = HexColor("#EEF4FF")
MINT = HexColor("#E9FAF3")
GREEN = HexColor("#137A56")
AMBER = HexColor("#FFF3D6")
INK = HexColor("#111827")
MUTED = HexColor("#5F6B7A")
LINE = HexColor("#D9E1EC")
PAPER = HexColor("#FAFCFF")


def register_fonts():
    candidates = [
        ("C:/Windows/Fonts/aptos.ttf", "C:/Windows/Fonts/aptos-bold.ttf"),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("CR-Regular", regular))
            pdfmetrics.registerFont(TTFont("CR-Bold", bold))
            return
    raise FileNotFoundError("No supported print font found")


def rounded_box(c, x, y, w, h, title, subtitle="", fill=white, stroke=LINE, number=None):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, 9, fill=1, stroke=1)
    tx = x + 14
    if number is not None:
        c.setFillColor(BLUE)
        c.circle(x + 18, y + h - 18, 10, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("CR-Bold", 8)
        c.drawCentredString(x + 18, y + h - 21, str(number))
        tx = x + 34
    c.setFillColor(INK)
    c.setFont("CR-Bold", 11)
    c.drawString(tx, y + h - 22, title)
    if subtitle:
        c.setFillColor(MUTED)
        c.setFont("CR-Regular", 8.4)
        lines = subtitle.split("\n")
        for i, line in enumerate(lines):
            c.drawString(x + 14, y + h - 39 - (i * 11), line)


def arrow_down(c, x, y_top, y_bottom):
    c.setStrokeColor(BLUE)
    c.setFillColor(BLUE)
    c.setLineWidth(1.5)
    c.line(x, y_top, x, y_bottom + 5)
    c.line(x, y_bottom + 5, x - 3, y_bottom + 10)
    c.line(x, y_bottom + 5, x + 3, y_bottom + 10)


def chip(c, x, y, w, text):
    c.setFillColor(white)
    c.setStrokeColor(HexColor("#BFD0F3"))
    c.roundRect(x, y, w, 23, 11.5, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("CR-Bold", 7.8)
    c.drawCentredString(x + w / 2, y + 7.5, text)


def bullet(c, x, y, text, color=GREEN):
    c.setFillColor(color)
    c.circle(x, y + 3, 2.4, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("CR-Regular", 8.4)
    c.drawString(x + 8, y, text)


def build():
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("CandidRoute Student Conversion Flow")
    c.setAuthor("CandidRoute")
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    margin = 38
    content_w = width - 2 * margin

    c.setFillColor(NAVY)
    c.roundRect(margin, height - 112, content_w, 72, 14, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("CR-Bold", 20)
    c.drawString(margin + 22, height - 72, "CandidRoute Student Conversion Flow")
    c.setFont("CR-Regular", 9.5)
    c.setFillColor(HexColor("#DCE8FF"))
    c.drawString(margin + 22, height - 92, "Give meaningful value first. Sell continuous admission support, not a single report.")

    box_w = 235
    box_h = 52
    left = (width - box_w) / 2
    y_positions = [664, 588, 512, 436]
    stages = [
        ("Start free assessment", "No login wall before the student begins."),
        ("Validate and analyse", "Normalize answers, run eligibility rules and rank routes."),
        ("Create account or log in", "Save progress immediately before revealing the result."),
        ("Show the free personalised report", "Provide a useful result before presenting payment."),
    ]
    for idx, ((title, subtitle), y) in enumerate(zip(stages, y_positions), start=1):
        rounded_box(c, left, y, box_w, box_h, title, subtitle, fill=white, number=idx)
        if idx < len(stages):
            arrow_down(c, width / 2, y, y_positions[idx] + box_h)

    free_y = 342
    c.setFillColor(BLUE_LIGHT)
    c.setStrokeColor(HexColor("#9AB8FA"))
    c.roundRect(margin, free_y, content_w, 72, 12, fill=1, stroke=1)
    c.setFillColor(BLUE)
    c.setFont("CR-Bold", 9)
    c.drawString(margin + 16, free_y + 52, "FREE REPORT INCLUDES")
    chip_gap = 7
    chip_widths = [79, 77, 89, 94, 107]
    chip_texts = ["Readiness score", "Top 3 routes", "Top 3 gaps", "3 country previews", "3 university previews"]
    x = margin + 16
    for text, w in zip(chip_texts, chip_widths):
        chip(c, x, free_y + 15, w, text)
        x += w + chip_gap

    arrow_down(c, width / 2, free_y, 311)
    c.setFillColor(AMBER)
    c.setStrokeColor(HexColor("#E8C56A"))
    c.roundRect(178, 266, 239, 45, 10, fill=1, stroke=1)
    c.setFillColor(INK)
    c.setFont("CR-Bold", 11)
    c.drawCentredString(width / 2, 290, "Unlock complete CandidRoute?")
    c.setFont("CR-Regular", 8.2)
    c.setFillColor(MUTED)
    c.drawCentredString(width / 2, 276, "Subscription appears only after the student sees personal value.")

    c.setStrokeColor(LINE)
    c.setLineWidth(1.3)
    c.line(width / 2, 266, width / 2, 248)
    c.line(145, 248, 450, 248)
    c.line(145, 248, 145, 232)
    c.line(450, 248, 450, 232)
    c.setFont("CR-Bold", 8)
    c.setFillColor(MUTED)
    c.drawCentredString(145, 251, "NOT YET")
    c.setFillColor(GREEN)
    c.drawCentredString(450, 251, "SUBSCRIBE")

    panel_y = 92
    panel_h = 140
    panel_w = 244
    rounded_box(c, margin, panel_y, panel_w, panel_h, "Free account remains active", fill=white, stroke=LINE)
    bullet(c, margin + 20, panel_y + 88, "Save the basic report")
    bullet(c, margin + 20, panel_y + 68, "Return later without losing progress")
    bullet(c, margin + 20, panel_y + 48, "See locked-module previews")
    bullet(c, margin + 20, panel_y + 28, "Upgrade when ready")

    rounded_box(c, width - margin - panel_w, panel_y, panel_w, panel_h, "Complete admission workspace", fill=MINT, stroke=HexColor("#8BD7BC"))
    px = width - margin - panel_w + 20
    bullet(c, px, panel_y + 88, "All recommendations and pathways")
    bullet(c, px, panel_y + 68, "Full PDF and evidence analysis")
    bullet(c, px, panel_y + 48, "Applications, tasks and deadlines")
    bullet(c, px, panel_y + 28, "Documents, alerts and live updates")

    c.setFillColor(MUTED)
    c.setFont("CR-Regular", 7.5)
    c.drawString(margin, 53, "Product rule: calculate the complete analysis first; limit only what the free user can view.")
    c.setFillColor(BLUE)
    c.setFont("CR-Bold", 7.5)
    c.drawRightString(width - margin, 53, "CANDIDROUTE - APPROVED FREEMIUM FUNNEL")

    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
