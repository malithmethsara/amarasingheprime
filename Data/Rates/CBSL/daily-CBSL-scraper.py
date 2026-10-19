from curl_cffi import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timezone, timedelta
import os
import re
import sys

MAIN_PAGE_URL = "https://www.cbsl.gov.lk/en/rates-and-indicators/exchange-rates"
IFRAME_URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"
CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"

def scrape_rate():
    # Impersonate real Google Chrome TLS/JA3 & HTTP/2 fingerprint
    session = requests.Session(impersonate="chrome")
    
    main_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1",
    }
    
    iframe_headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": MAIN_PAGE_URL,
        "Sec-Fetch-Dest": "iframe",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Upgrade-Insecure-Requests": "1",
    }

    try:
        # Step 1: Visit the main page first to collect CBSL firewall/session cookies
        print(f"Warming up session via {MAIN_PAGE_URL}...")
        session.get(MAIN_PAGE_URL, headers=main_headers, timeout=30, verify=False)

        # Step 2: Fetch the JPY iframe using the established session and Referer
        print(f"Fetching JPY iframe {IFRAME_URL}...")
        response = session.get(IFRAME_URL, headers=iframe_headers, timeout=30, verify=False)
        print(f"HTTP Status Code: {response.status_code}")
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator=" ").replace('\xa0', ' ')

        match = re.search(r'Sell\s+([\d\.]+)', text_content, re.IGNORECASE)
        if match:
            rate = match.group(1).strip()
            print(f"Successfully scraped JPY/LKR Selling Rate: {rate}")
            return rate
        else:
            print("ERROR: Page loaded, but 'Sell' rate was not found in HTML.")
            print("Page snippet:", text_content[:500])
            return None

    except Exception as e:
        print(f"Error scraping: {e}")
        return None

def update_csv(new_rate):
    # Use Sri Lanka Standard Time (UTC+5:30)
    sl_tz = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(sl_tz)
    current_date_str = now.strftime("%Y-%m-%d")
    
    os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
    
    rows = []
    if os.path.isfile(CSV_FILE):
        with open(CSV_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = [row for row in reader if len(row) >= 2]
            
    if not rows:
        rows = [["Date", "JPY_LKR_Selling_Rate"]]
        
    if len(rows) > 1:
        last_row = rows[-1]
        last_date_str = last_row[0].strip()
        last_rate = last_row[1].strip()
        
        if new_rate == last_rate:
            print(f"Rate {new_rate} is unchanged. Skipping.")
            return

        if last_date_str == current_date_str:
            print(f"Rate changed today! Overwriting today's entry ({last_rate} -> {new_rate}).")
            rows[-1] = [current_date_str, new_rate]
        else:
            print(f"New rate {new_rate} for a new day ({current_date_str}). Appending.")
            rows.append([current_date_str, new_rate])
    else:
        rows.append([current_date_str, new_rate])
        
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print("CSV successfully updated.")

if __name__ == "__main__":
    rate = scrape_rate()
    if rate:
        update_csv(rate)
    else:
        # Force a red 'X' in GitHub Actions if scraping ever fails
        sys.exit(1)
