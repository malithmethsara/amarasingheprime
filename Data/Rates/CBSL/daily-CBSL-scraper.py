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

def extract_rate(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    # Convert HTML non-breaking spaces to standard spaces
    text_content = soup.get_text(separator=" ").replace('\xa0', ' ')
    match = re.search(r'Sell\s+([\d\.]+)', text_content, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def scrape_rate():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    }
    
    # Append a timestamp to the URL to force proxies to bypass their cache
    timestamp = int(datetime.now().timestamp())
    busted_url = f"{TARGET_URL}?t={timestamp}"
    encoded_url = urllib.parse.quote(busted_url)
    
    # Strategy 1: Direct approach
    try:
        print("Strategy 1: Direct Connection...")
        res = requests.get(busted_url, headers=headers, timeout=15, verify=False)
        if res.status_code == 200:
            rate = extract_rate(res.text)
            if rate:
                print(f"Success via Direct! Rate: {rate}")
                return rate
        else:
            print(f"Direct failed with status code: {res.status_code}")
    except Exception as e:
        print(f"Direct failed: {e}")

    # Strategy 2: AllOrigins Public Proxy
    try:
        print("\nStrategy 2: AllOrigins Proxy...")
        proxy1 = f"https://api.allorigins.win/get?url={encoded_url}"
        res = requests.get(proxy1, timeout=20)
        if res.status_code == 200:
            data = res.json()
            if 'contents' in data:
                rate = extract_rate(data['contents'])
                if rate:
                    print(f"Success via AllOrigins! Rate: {rate}")
                    return rate
    except Exception as e:
        print(f"AllOrigins failed: {e}")

    # Strategy 3: CodeTabs Public Proxy
    try:
        print("\nStrategy 3: CodeTabs Proxy...")
        proxy2 = f"https://api.codetabs.com/v1/proxy?quest={encoded_url}"
        res = requests.get(proxy2, timeout=20)
        if res.status_code == 200:
            rate = extract_rate(res.text)
            if rate:
                print(f"Success via CodeTabs! Rate: {rate}")
                return rate
    except Exception as e:
        print(f"CodeTabs failed: {e}")

    print("\nERROR: All scraping strategies failed.")
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
        sys.exit(1)
