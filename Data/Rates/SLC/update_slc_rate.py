#!/usr/bin/env python3
"""
Fetch the weekly Sri Lanka Customs exchange-rate PDF, extract the JPY rate
from the scanned page, validate it and append "YYYY-MM-DD,rate" to SLC-rates.csv.

Exit codes: 0 = updated / already up to date / PDF not published yet
            1 = PDF found but rate could not be read with confidence (nothing written)
"""
import argparse, datetime as dt, os, re, subprocess, sys, tempfile, xml.etree.ElementTree as ET
import requests
from PIL import Image, ImageOps
import pytesseract

RATES_FILE = "Data/Rates/SLC/SLC-rates.csv"
URL = "https://www.customs.gov.lk/wp-content/uploads/{y}/{m:02d}/er{d:%d%m%Y}.pdf"
RATE_RE = re.compile(r"(\d)[.,_ ]?(\d{4})\b")
MIN_RATE, MAX_RATE = 1.5, 3.0      # sanity window for JPY->LKR
MAX_WEEKLY_MOVE = 0.06             # reject >6% change vs previous week


def target_monday(today: dt.date) -> dt.date:
    # Fri-Sun -> upcoming Monday (notification is often published the Friday before); Mon-Thu -> this Monday
    if today.weekday() >= 4:
        return today + dt.timedelta(days=7 - today.weekday())
    return today - dt.timedelta(days=today.weekday())


def download(d: dt.date, dest: str) -> bool:
    # Upload folder is the month of upload; try the Monday's month, then the previous month
    prev = (d.replace(day=1) - dt.timedelta(days=1))
    for y, m in ((d.year, d.month), (prev.year, prev.month)):
        r = requests.get(URL.format(y=y, m=m, d=d), timeout=60,
                         headers={"User-Agent": "Mozilla/5.0 (rate-updater)"})
        if r.status_code == 200 and r.content[:4] == b"%PDF":
            open(dest, "wb").write(r.content)
            print(f"Downloaded {r.url}")
            return True
    return False


def normalise(s: str):
    """'2_1466' / '2,1466' / '2.1466 7' -> 2.1466, else None."""
    m = RATE_RE.search(s.replace("O", "0"))
    return float(f"{m.group(1)}.{m.group(2)}") if m else None


def rasterise(pdf: str, workdir: str):
    subprocess.run(["pdftoppm", "-r", "300", "-png", pdf, f"{workdir}/pg"], check=True)
    return sorted(f for f in os.listdir(workdir) if f.startswith("pg") and f.endswith(".png"))


def text_layer_candidates(pdf: str):
    """Scanner-embedded OCR layer: returns (page_no, bbox_of_JPY_word, text_of_rate_word_on_same_row)."""
    out = subprocess.run(["pdftotext", "-bbox", pdf, "-"], capture_output=True, text=True).stdout
    out = re.sub(r"<!DOCTYPE[^>]*>", "", out)
    out = out.replace("xmlns=\"http://www.w3.org/1999/xhtml\"", "")
    try:
        root = ET.fromstring(out)
    except ET.ParseError:
        return []
    res = []
    for pno, page in enumerate(root.iter("page"), 1):
        pw = float(page.get("width"))
        words = [(w.text or "", float(w.get("xMin")), float(w.get("yMin")),
                  float(w.get("xMax")), float(w.get("yMax"))) for w in page.iter("word")]
        for t, x0, y0, x1, y1 in words:
            if t.strip().upper() == "JPY":
                cy = (y0 + y1) / 2
                row = [w for w in words if abs((w[2] + w[4]) / 2 - cy) < 4 and w[1] > x1]
                res.append((pno, pw, (x0, y0, x1, y1), " ".join(w[0] for w in sorted(row, key=lambda w: w[1]))))
    return res


def ocr_cell(img: Image.Image, box_px):
    """OCR the rate cell (right of the JPY code) with a digits-only whitelist, several preprocessings."""
    x1, y0, y1 = box_px
    vals = []
    for thr in (130, 150, 170):
        c = img.crop((int(x1 + 10), int(y0 - 8), int(img.width * 0.95), int(y1 + 8))).convert("L")
        c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS).point(lambda p, t=thr: 255 if p > t else 0)
        c = ImageOps.expand(c, border=20, fill=255)
        for psm in (7, 8):
            t = pytesseract.image_to_string(c, config=f"--psm {psm} -c tessedit_char_whitelist=0123456789.,")
            v = normalise(t)
            if v is None and re.fullmatch(r"\D*(\d{5})\D*", t.strip()):   # '21466' -> 2.1466
                v = float(f"{t.strip()[0]}.{t.strip()[1:5]}")
            if v:
                vals.append(v)
    return vals


def locate_jpy_by_ocr(img: Image.Image):
    """Fallback if the scanner text layer is missing: find 'JPY' with Tesseract itself."""
    d = pytesseract.image_to_data(img, config="--psm 6", output_type=pytesseract.Output.DICT)
    for i, t in enumerate(d["text"]):
        if t.strip().upper() in ("JPY", "JPV", "IPY"):
            return d["left"][i] + d["width"][i], d["top"][i], d["top"][i] + d["height"][i]
    return None


def extract_jpy(pdf: str):
    from collections import Counter
    votes, notes = Counter(), []
    with tempfile.TemporaryDirectory() as wd:
        pages = rasterise(pdf, wd)
        for pno, pw, (x0, y0, x1, y1), row_text in text_layer_candidates(pdf):
            img = Image.open(f"{wd}/{pages[pno - 1]}")
            s = img.width / pw
            v = normalise(row_text)
            if v:
                votes[v] += 1; notes.append(f"text-layer: {v}")
            for v in ocr_cell(img, (x1 * s, y0 * s, y1 * s)):
                votes[v] += 1
            notes.append(f"cell OCR page {pno}: {dict(votes)}")
        if not votes:                                    # no text layer -> pure image route
            for name in pages:
                img = Image.open(f"{wd}/{name}")
                loc = locate_jpy_by_ocr(img)
                if loc:
                    for v in ocr_cell(img, loc):
                        votes[v] += 1
            notes.append(f"image-only OCR: {dict(votes)}")
    print("\n".join(notes))
    return votes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="Monday date YYYY-MM-DD (default: auto)")
    ap.add_argument("--pdf", help="use a local PDF instead of downloading")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    d = dt.date.fromisoformat(a.date) if a.date else target_monday(dt.date.today())
    hist = {}
    for l in open(RATES_FILE, encoding="utf-8"):
        parts = [x.strip() for x in l.split(",")]
        try:                                   # skips a header row such as "date,rate" if present
            hist[dt.date.fromisoformat(parts[0]).isoformat()] = float(parts[1])
        except (ValueError, IndexError):
            continue
    if d.isoformat() in hist:
        print(f"{d} already present ({hist[d.isoformat()]}); nothing to do."); return 0

    pdf = a.pdf or os.path.join(tempfile.gettempdir(), f"er{d:%d%m%Y}.pdf")
    if not a.pdf and not download(d, pdf):
        print(f"PDF for {d} not published yet."); return 0

    votes = extract_jpy(pdf)
    prev = hist[max(hist)]
    ok = [(n, v) for v, n in votes.items()
          if MIN_RATE <= v <= MAX_RATE and abs(v - prev) / prev <= MAX_WEEKLY_MOVE]
    if not ok:
        print(f"::error::Could not read a valid JPY rate for {d}. Candidates: {dict(votes)}. Update manually.")
        return 1
    ok.sort(reverse=True)
    if len(ok) > 1 and ok[0][0] == ok[1][0]:
        print(f"::error::Ambiguous JPY readings for {d}: {ok}. Update manually."); return 1
    rate = ok[0][1]
    print(f"JPY {d}: {rate:.4f} (previous {prev:.4f}, change {100*(rate-prev)/prev:+.2f}%)")
    if not a.dry_run:
        body = open(RATES_FILE, encoding="utf-8").read().rstrip("\n")
        with open(RATES_FILE, "w", encoding="utf-8") as f:
            f.write(f"{body}\n{d.isoformat()},{rate:.4f}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
