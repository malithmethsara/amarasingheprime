import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timezone, timedelta
import os
import re
import sys
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"
TARGET_URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"

# Fetch the secure ScraperAPI Key from GitHub Actions Environment
API_KEY = os.environ.get("SCRAPER_API_KEY")

if not API_KEY:
    print("ERROR: SCRAPER_API_KEY not found in environment variables.")
    sys.exit(1)

def scrape_rate():
    payload = {
        'api_key': API_KEY,
        'url': TARGET_URL,
        'render': 'false' 
    }
    
    try:
        print("Fetching CBSL data via ScraperAPI anti-bot network...")
        # Timeout set to 60s because residential proxies take a few seconds to rotate
        res = requests.get('https://api.scraperapi.com/', params=payload, timeout=60)
        res.raise_for_status()
        
        soup = BeautifulSoup(res.text, 'html.parser')
        text_content = soup.get_text(separator=" ").replace('\xa0', ' ')
        
        match = re.search(r'Sell\s+([\d\.]+)', text_content, re.IGNORECASE)
        if match:
            rate = match.group(1).strip()
            return rate
        else:
            print("ERROR: 'Sell' rate not found in the HTML.")
            print("Response snippet:", res.text[:200])
            
    except Exception as e:
        print(f"Scraping failed: {e}")
        
    return None

def update_csv(new_rate):
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
            print(f"Rate {new_rate} is unchanged from last entry ({last_date_str}). Skipping CSV write.")
            return

        if last_date_str == current_date_str:
            print(f"Rate changed today ({current_date_str})! Overwriting {last_rate} -> {new_rate}.")
            rows[-1] = [current_date_str, new_rate]
        else:
            print(f"New rate {new_rate} for {current_date_str}. Appending.")
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
        print(f"Successfully scraped JPY/LKR Selling Rate: {rate}")
        update_csv(rate)
    else:
        sys.exit(1)
