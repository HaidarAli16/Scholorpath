from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "CandidRoute_Freemium_Flowchart_Print_Ready_A3.pdf"
OUTPUT_A4 = ROOT / "output" / "pdf" / "CandidRoute_Freemium_Flowchart_Print_Ready_A4.pdf"
W, H = landscape(A3)

BG = HexColor("#FFFFFF")
BOX = HexColor("#F7F8FA")
BOX_BORDER = HexColor("#333333")
TEXT = HexColor("#111111")
LINE = HexColor("#444444")
LABEL = HexColor("#111111")


def register_fonts():
    regular = Path("C:/Windows/Fonts/arial.ttf")
    bold = Path("C:/Windows/Fonts/arialbd.ttf")
    pdfmetrics.registerFont(TTFont("Flow", str(regular)))
    pdfmetrics.registerFont(TTFont("FlowBold", str(bold)))


def node(c, x, y, w, h, lines, font_size=9):
    c.setFillColor(BOX)
    c.setStrokeColor(BOX_BORDER)
    c.setLineWidth(0.8)
    c.rect(x, y, w, h, fill=1, stroke=1)
    if isinstance(lines, str):
        lines = [lines]
    c.setFillColor(TEXT)
    c.setFont("Flow", font_size)
    line_h = font_size + 2
    total = len(lines) * line_h
    start = y + (h + total) / 2 - line_h
    for i, line in enumerate(lines):
        c.drawCentredString(x + w / 2, start - i * line_h, line)


def diamond(c, cx, cy, size, lines):
    c.setFillColor(BOX)
    c.setStrokeColor(BOX_BORDER)
    p = c.beginPath()
    p.moveTo(cx, cy + size)
    p.lineTo(cx + size, cy)
    p.lineTo(cx, cy - size)
    p.lineTo(cx - size, cy)
    p.close()
    c.drawPath(p, fill=1, stroke=1)
    c.setFillColor(TEXT)
    c.setFont("Flow", 8.5)
    if isinstance(lines, str):
        lines = [lines]
    for i, line in enumerate(lines):
        c.drawCentredString(cx, cy + 3 - i * 11, line)


def arrow(c, x1, y1, x2, y2, label=None, label_dx=0, label_dy=0):
    c.setStrokeColor(LINE)
    c.setFillColor(LINE)
    c.setLineWidth(0.8)
    c.line(x1, y1, x2, y2)
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 6
    spread = 0.52
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2 - length * math.cos(angle - spread), y2 - length * math.sin(angle - spread))
    p.lineTo(x2 - length * math.cos(angle + spread), y2 - length * math.sin(angle + spread))
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFillColor(LABEL)
        c.setFont("FlowBold", 8)
        c.drawString((x1 + x2) / 2 + label_dx, (y1 + y2) / 2 + label_dy, label)


def elbow_arrow(c, points, label=None, label_pos=None):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.8)
    for a, b in zip(points, points[1:]):
        c.line(a[0], a[1], b[0], b[1])
    arrow(c, points[-2][0], points[-2][1], points[-1][0], points[-1][1])
    if label and label_pos:
        c.setFillColor(LABEL)
        c.setFont("FlowBold", 8)
        c.drawString(label_pos[0], label_pos[1], label)


def build():
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(W, H))
    c.setTitle("CandidRoute Exact Freemium Funnel")
    c.setAuthor("CandidRoute")
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(HexColor("#111111"))
    c.setFont("FlowBold", 10)
    c.drawCentredString(W / 2, H - 18, "CANDIDROUTE - STUDENT REPORT AND SUBSCRIPTION FLOW")

    center_x = W / 2
    main_w, main_h = 132, 34
    main_x = center_x - main_w / 2
    main_nodes = [
        (H - 60, ["Landing Page"]),
        (H - 114, ["Start Free Assessment"]),
        (H - 168, ["Student Completes Profile"]),
        (H - 222, ["System Validates Answers"]),
        (H - 280, ["Recommendation Engine", "Runs"]),
        (H - 342, ["Create Free Account / Log", "In"]),
        (H - 396, ["Free Personalised Report"]),
    ]
    for i, (y, label) in enumerate(main_nodes):
        node(c, main_x, y, main_w, main_h, label, 8.5)
        if i < len(main_nodes) - 1:
            arrow(c, center_x, y, center_x, main_nodes[i + 1][0] + main_h)

    free_labels = [
        ["Readiness Score"],
        ["Top 3 Opportunities"],
        ["Top 3 Profile Gaps"],
        ["3 Country Previews"],
        ["3 University Previews"],
        ["Basic PDF Download"],
    ]
    free_w, free_h, free_gap = 126, 34, 24
    total_free = 6 * free_w + 5 * free_gap
    free_start = (W - total_free) / 2
    free_y = H - 458
    report_bottom = main_nodes[-1][0]
    free_centres = []
    for i, label in enumerate(free_labels):
        x = free_start + i * (free_w + free_gap)
        node(c, x, free_y, free_w, free_h, label, 8)
        free_centres.append(x + free_w / 2)
        arrow(c, center_x, report_bottom, x + free_w / 2, free_y + free_h)

    subscription_y = H - 520
    subscription_w = 132
    node(c, center_x - subscription_w / 2, subscription_y, subscription_w, 34, ["Subscription Offer"], 8.5)
    for fx in free_centres:
        arrow(c, fx, free_y, center_x, subscription_y + 34)

    diamond_cy = H - 595
    arrow(c, center_x, subscription_y, center_x, diamond_cy + 43)
    diamond(c, center_x, diamond_cy, 43, ["Student Subscribes?"])

    outcome_y = H - 700
    outcome_w, outcome_h = 145, 46
    free_out_x = 40
    paid_out_x = W / 2 + 120
    node(c, free_out_x, outcome_y, outcome_w, outcome_h, ["Free Account Remains", "Active"], 8.5)
    node(c, paid_out_x, outcome_y, outcome_w, outcome_h, ["Unlock Complete", "CandidRoute"], 8.5)

    arrow(c, center_x - 39, diamond_cy - 20, free_out_x + outcome_w / 2, outcome_y + outcome_h, "Not yet", -22, 8)
    arrow(c, center_x + 39, diamond_cy - 20, paid_out_x + outcome_w / 2, outcome_y + outcome_h, "Yes", 5, 8)

    bottom_y = 18
    node(c, 22, bottom_y, 116, 40, ["Save Report and Return", "Later"], 7.5)
    arrow(c, free_out_x + outcome_w / 2, outcome_y, 22 + 58, bottom_y + 40)

    premium_labels = [
        ["All Eligible Opportunities"],
        ["Complete Gap and Evidence", "Analysis"],
        ["All Countries and", "Universities"],
        ["Full Detailed PDF Report"],
        ["Application Tracker and", "Kanban"],
        ["Tasks, Impact Scores and", "Deadlines"],
        ["Documents and Evidence", "Workspace"],
        ["Alerts and Updated", "Recommendations"],
    ]
    premium_w, premium_h, premium_gap = 120, 40, 8
    premium_start = 146
    source_x = paid_out_x + outcome_w / 2
    for i, label in enumerate(premium_labels):
        x = premium_start + i * (premium_w + premium_gap)
        node(c, x, bottom_y, premium_w, premium_h, label, 7.5)
        arrow(c, source_x, outcome_y, x + premium_w / 2, bottom_y + premium_h)

    c.setFillColor(HexColor("#555555"))
    c.setFont("Flow", 7)
    c.drawRightString(W - 18, 7, "A3 landscape - print at Actual Size or Fit to Page")
    c.showPage()
    c.save()

    reader = PdfReader(str(OUTPUT))
    page = reader.pages[0]
    a4_w, a4_h = landscape(A4)
    page.scale_to(a4_w, a4_h)
    writer = PdfWriter()
    writer.add_page(page)
    with OUTPUT_A4.open("wb") as stream:
        writer.write(stream)
    print(OUTPUT)
    print(OUTPUT_A4)


if __name__ == "__main__":
    build()
