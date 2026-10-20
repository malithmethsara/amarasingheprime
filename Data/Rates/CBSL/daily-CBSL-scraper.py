import csv
import os
import re
import sys
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"
REFERER = "https://www.cbsl.gov.lk/rates-and-indicators/exchange-rates"
CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": REFERER,
}

# Tried in order. First one that matches wins.
PATTERNS = [
    r"Sell(?:ing)?\s*(?:Rate)?\s*[:\-]?\s*([\d]+\.[\d]+)",
    r"Sell(?:ing)?\D{0,30}([\d]+\.[\d]+)",
]


def fetch_html(retries=3):
    session = requests.Session()
    session.headers.update(HEADERS)
    for attempt in range(1, retries + 1):
        try:
            # Visit the parent page first so we look like a normal browser session.
            session.get(REFERER, timeout=20)
            r = session.get(URL, timeout=20)
            print(f"[attempt {attempt}] HTTP {r.status_code} | {len(r.text)} bytes | "
                  f"server={r.headers.get('Server')} | cf-ray={r.headers.get('CF-RAY')} | "
                  f"content-type={r.headers.get('Content-Type')}")
            if r.status_code == 200:
                return r.text
            print("Body snippet:", r.text[:300].replace("\n", " "))
        except Exception as e:
            print(f"[attempt {attempt}] request error: {e}")
        time.sleep(5 * attempt)
    return None


def scrape_rate():
    html = fetch_html()
    if not html:
        print("FAILED: no usable HTTP response (blocked, timeout, or non-200).")
        return None

    text = BeautifulSoup(html, "html.parser").get_text(separator=" ")
    text = re.sub(r"\s+", " ", text)

    for pat in PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()

    # Nothing matched: dump what we received so the Actions log shows why.
    print("FAILED: HTTP 200 but no 'Sell' rate found. Page text received:")
    print(text[:800])
    print("Raw HTML head:")
    print(html[:800])
    return None


def update_csv(new_rate):
    now = datetime.now()
    current_date_str = now.strftime("%Y-%m-%d")

    os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)

    rows = []
    if os.path.isfile(CSV_FILE):
        with open(CSV_FILE, "r", newline="") as f:
            rows = [row for row in csv.reader(f) if len(row) >= 2]

    if not rows:
        rows = [["Date", "JPY_LKR_Selling_Rate"]]

    if len(rows) > 1:
        last_date_str, last_rate = rows[-1][0], rows[-1][1]
        if new_rate == last_rate:
            print(f"Rate {new_rate} is unchanged. Skipping.")
            return
        if last_date_str == current_date_str:
            print("Rate changed today. Overwriting today's entry.")
            rows[-1] = [current_date_str, new_rate]
        else:
            print(f"New rate {new_rate} for a new day. Appending.")
            rows.append([current_date_str, new_rate])
    else:
        rows.append([current_date_str, new_rate])

    with open(CSV_FILE, "w", newline="") as f:
        csv.writer(f).writerows(rows)
    print("CSV successfully updated.")


if __name__ == "__main__":
    rate = scrape_rate()
    if not rate:
        sys.exit(1)  # make the workflow go RED instead of silently passing
    update_csv(rate)
