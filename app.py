# =====================================================
# IMPORTS
# =====================================================
import os
import io
import json
import base64
import cv2
from datetime import datetime
from flask import (
    Flask, render_template, request, jsonify,
    send_file, redirect, url_for, session
)
from reportlab.pdfgen import canvas
from docx import Document

# =====================================================
# INIT FLASK
# =====================================================
app = Flask(__name__)
app.secret_key = "secret_key_for_session"

UPLOAD_FOLDER = os.path.join("static", "uploads")
HISTORY_FILE = "history.json"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# =====================================================
# PALETTE DATA
# =====================================================
PALETTES = {
    "Spring": [("Peach", "#FFDAB9"), ("Coral", "#FF7F50")],
    "Summer": [("Soft Lilac", "#E6D3F5"), ("Dusty Rose", "#D8A0A7")],
    "Autumn": [("Terracotta", "#C8643B"), ("Olive Green", "#708238")],
    "Winter": [("Emerald", "#046307"), ("Burgundy", "#800020")],
    "Neutral": [("Classic Beige", "#D7C8B3"), ("Taupe", "#B4A79E")]
}

LIP_SHADES = {
    "Spring": {"Maybelline": "Peach Buff"},
    "Summer": {"Maybelline": "Pink Sand"},
    "Autumn": {"Maybelline": "Toasted Brown"},
    "Winter": {"Maybelline": "Crimson Bold"},
    "Neutral": {"Maybelline": "Nude Rose"}
}

FOUNDATION_MAP = {
    "Warm": "Maybelline Fit Me 220",
    "Cool": "Maybelline Fit Me 115",
    "Neutral": "Maybelline Fit Me 128"
}

# =====================================================
# HISTORY UTILS
# =====================================================
def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

HISTORY = load_history()

# =====================================================
# IMAGE ANALYSIS
# =====================================================
def analyze_image_average_rgb(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]
    
    cy, cx = h // 2, w // 2
    sy, sx = max(10, h // 8), max(10, w // 8)
    
    roi = img_rgb[max(0, cy - sy):min(h, cy + sy),
                  max(0, cx - sx):min(w, cx + sx)]
    
    if roi.size == 0:
        roi = img_rgb

    avg = roi.mean(axis=(0, 1))
    return float(avg[0]), float(avg[1]), float(avg[2])


def determine_undertone_and_season(r, g, b):
      # Tentukan undertone
    if r > g + 8 and r > b + 8:
        undertone = "Warm"
    elif b > r + 8 and b > g + 8:
        undertone = "Cool"
    else:
        undertone = "Neutral"

    # Tentukan season berdasarkan brightness
    brightness = (r + g + b) / 3.0

    if undertone == "Warm":
        season = "Spring" if brightness > 150 else "Autumn"
    elif undertone == "Cool":
        season = "Summer" if brightness > 140 else "Winter"
    else:
        season = "Neutral"

    return undertone, season


# =====================================================
# FILE GENERATOR (PDF & DOCX)
# =====================================================
@app.route("/download/pdf", methods=["POST"])
def download_pdf():
    data = request.get_json()
    title = data.get("title", "")
    undertone = data.get("undertone", "")
    season = data.get("season", "")
    recommendation = data.get("recommendation", "")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)

    p.drawString(100, 800, f"Glow Finder - {title}")
    p.drawString(100, 780, f"Undertone: {undertone}")
    p.drawString(100, 760, f"Season: {season}")
    p.drawString(100, 740, f"Recommendation: {recommendation}")
    
    p.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="glowfinder_result.pdf",
        mimetype="application/pdf"
    )


@app.route("/download/docx", methods=["POST"])
def download_docx_custom():
    data = request.get_json()
    title = data.get("title", "")
    undertone = data.get("undertone", "")
    season = data.get("season", "")
    recommendation = data.get("recommendation", "")

    doc = Document()
    doc.add_heading(f"Glow Finder - {title}", level=1)
    doc.add_paragraph(f"Undertone: {undertone}")
    doc.add_paragraph(f"Season: {season}")
    doc.add_paragraph(f"Recommendation: {recommendation}")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="glowfinder_result.docx"
    )

# =====================================================
# ROUTES
# =====================================================
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        session["name"] = request.form.get("name")
        session["age"] = request.form.get("age")
        session["email"] = request.form.get("email")
        return redirect(url_for("choose"))
    return render_template("index.html")


@app.route("/choose", methods=["GET", "POST"])
def choose():
    if request.method == "POST":
        analyzer_choice = request.form.get("analyzer_choice")
        session["analyzer_choice"] = analyzer_choice
        return redirect(url_for("camera_test", type=analyzer_choice))
    return render_template("choose.html")

@app.route('/cam_test')
def cam_test():
    mode = request.args.get("mode", "undertone")
    return render_template('cam_tes.html')

@app.route("/analyze_image", methods=["POST"])
def analyze_image():
    image_base64 = request.json["image"]
    image_data = base64.b64decode(image_base64.split(",")[1])

    filename = "captured.png"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    with open(filepath, "wb") as f:
        f.write(image_data)

    r, g, b = analyze_image_average_rgb(filepath)
    undertone, season = determine_undertone_and_season(r, g, b)

    return jsonify({"undertone": undertone, "season": season})

@app.route("/result_undertone")
def result_undertone():
    return render_template("result_undertone.html")

@app.route("/result_season")
def result_season():
    return render_template("result_season.html")

@app.route("/history")
def history():
    return render_template("history.html")


# =====================================================
# RUN FLASK
# =====================================================
if __name__ == "__main__":
    app.run(debug=True)