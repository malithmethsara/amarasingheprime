import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timezone, timedelta
import os
import re
import sys
import urllib.parse
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"
TARGET_URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"

def scrape_rate():
    timestamp = int(datetime.now().timestamp())
    busted_url = f"{TARGET_URL}?t={timestamp}"
    encoded_url = urllib.parse.quote(busted_url)
    
    # Waterfall Strategy: Try multiple independent free proxies
    proxies = [
        f"https://corsproxy.io/?{encoded_url}",
        f"https://api.codetabs.com/v1/proxy?quest={encoded_url}"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0 Safari/537.36"
    }

    for proxy_url in proxies:
        proxy_name = proxy_url.split('/')[2]
        try:
            print(f"Attempting to fetch CBSL data via {proxy_name}...")
            res = requests.get(proxy_url, headers=headers, timeout=20, verify=False)
            
            if res.status_code == 200 and 'Sell' in res.text:
                soup = BeautifulSoup(res.text, 'html.parser')
                text_content = soup.get_text(separator=" ").replace('\xa0', ' ')
                
                match = re.search(r'Sell\s+([\d\.]+)', text_content, re.IGNORECASE)
                if match:
                    rate = match.group(1).strip()
                    print(f"SUCCESS: Scraped JPY/LKR Selling Rate via {proxy_name} -> {rate}")
                    return rate
            else:
                print(f"Failed via {proxy_name}. HTTP Status: {res.status_code}")
                
        except Exception as e:
            print(f"Proxy {proxy_name} connection error: {e}")
            
    print("CRITICAL ERROR: All fallback proxies failed or were blocked.")
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
        update_csv(rate)
    else:
        sys.exit(1)
