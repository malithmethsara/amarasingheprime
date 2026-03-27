import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime
import os
import re

URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"
CSV_FILE = "Data/Rates/CBSL/CBSL-rates.csv"

def scrape_rate():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    try:
        response = requests.get(URL, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator=" ")
        
        match = re.search(r'Sell\s+([\d\.]+)', text_content)
        if match:
            return match.group(1).strip()
        return None
    except Exception as e:
        print(f"Error scraping: {e}")
        return None

def update_csv(new_rate):
    now = datetime.now()
    current_date_str = now.strftime("%Y-%m-%d")
    
    os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
    
    rows = []
    file_exists = os.path.isfile(CSV_FILE)
    
    if file_exists:
        with open(CSV_FILE, 'r', newline='') as f:
            reader = csv.reader(f)
            # THIS IS THE FIX: It forces the script to only read rows that actually have data
            rows = [row for row in reader if len(row) >= 2]
            
    if not rows:
        rows = [["Date", "JPY_LKR_Selling_Rate"]]
        
    if len(rows) > 1:
        last_row = rows[-1]
        last_date_str = last_row[0]
        last_rate = last_row[1]
        
        if new_rate == last_rate:
            print(f"Rate {new_rate} is unchanged. Skipping.")
            return

        if last_date_str == current_date_str:
            print(f"Rate changed today! Overwriting today's entry.")
            rows[-1] = [current_date_str, new_rate]
        else:
            print(f"New rate {new_rate} for a new day. Appending.")
            rows.append([current_date_str, new_rate])
            
    else:
        rows.append([current_date_str, new_rate])
        
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print("CSV successfully updated.")

if __name__ == "__main__":
    rate = scrape_rate()
    if rate:
        update_csv(rate)
