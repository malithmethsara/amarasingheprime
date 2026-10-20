import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timezone, timedelta
import os
import re
import sys
import urllib3

# Suppress SSL warnings for the CBSL domain
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"
CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"

def scrape_rate():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.cbsl.gov.lk/en/rates-and-indicators/exchange-rates",
        "Connection": "keep-alive"
    }
    
    try:
        print(f"Fetching {URL}...")
        response = requests.get(URL, headers=headers, timeout=30, verify=False)
        print(f"HTTP Status Code: {response.status_code}")
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        # Replace non-breaking spaces (\xa0) with standard spaces before matching
        text_content = soup.get_text(separator=" ").replace('\xa0', ' ')
        
        match = re.search(r'Sell\s+([\d\.]+)', text_content, re.IGNORECASE)
        if match:
            rate = match.group(1).strip()
            print(f"Successfully scraped JPY/LKR Selling Rate: {rate}")
            return rate
        else:
            print("ERROR: 'Sell' rate not found in HTML.")
            return None
            
    except Exception as e:
        print(f"Error scraping CBSL: {e}")
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
        update_csv(rate)
    else:
        # Exit with error code 1 so GitHub Actions marks the run as Failed
        sys.exit(1)
