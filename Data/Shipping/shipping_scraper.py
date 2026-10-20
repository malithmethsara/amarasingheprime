import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime, timezone, timedelta
import os
import re
import sys
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

URL = "https://www.cbsl.gov.lk/en/rates-and-indicators/exchange-rates"
CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"

def scrape_rate():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,si;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }
    
    try:
        print(f"Fetching main CBSL exchange rates page...")
        response = requests.get(URL, headers=headers, timeout=30, verify=False)
        print(f"Status Code: {response.status_code}")
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator=" ").replace('\xa0', ' ')
        
        # Search for JPY Selling rate on the main page text or table
        # Let's search for JPY and look for the selling rate pattern
        match = re.search(r'JPY.*?Sell\s*([\d\.]+)', text_content, re.IGNORECASE)
        if not match:
            # Fallback search pattern
            match = re.search(r'Japanese Yen.*?([\d\.]+)', text_content, re.IGNORECASE)
            
        if match:
            rate = match.group(1).strip()
            print(f"Successfully scraped JPY Rate: {rate}")
            return rate
            
        print("ERROR: JPY rate not matched in main page text.")
        return None
        
    except Exception as e:
        print(f"Error scraping: {e}")
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
            print(f"Rate {new_rate} is unchanged. Skipping.")
            return

        if last_date_str == current_date_str:
            rows[-1] = [current_date_str, new_rate]
        else:
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
