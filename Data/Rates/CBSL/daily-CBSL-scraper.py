import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime
import os
import re

URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"

# NEW: Updated file path
CSV_FILE = "Data/Rates/CBSL/jpy_lkr_rates.csv"

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
    current_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    current_date_str = now.strftime("%Y-%m-%d")
    
    # NEW: Ensure the folder exists before trying to read or write
    os.makedirs(os.path.dirname(CSV_FILE), exist_ok=True)
    
    rows = []
    file_exists = os.path.isfile(CSV_FILE)
    
    # Read existing data
    if file_exists:
        with open(CSV_FILE, 'r', newline='') as f:
            reader = csv.reader(f)
            rows = list(reader)
            
    # If the file is completely empty, set up the headers
    if not rows:
        rows = [["Timestamp", "JPY_LKR_Selling_Rate"]]
        
    # Check the logic if we have existing data rows
    if len(rows) > 1:
        last_row = rows[-1]
        last_timestamp_str = last_row[0]
        last_rate = last_row[1]
        
        # 1. If rate hasn't changed, do nothing
        if new_rate == last_rate:
            print(f"Rate {new_rate} is unchanged from the last entry. Skipping.")
            return

        # 2. If rate changed, check if it's the same day
        last_date_str = last_timestamp_str.split(" ")[0]
        if last_date_str == current_date_str:
            print(f"Rate changed today! Overwriting today's previous entry with {new_rate}.")
            rows[-1] = [current_time_str, new_rate]
        else:
            print(f"New rate {new_rate} for a new day. Appending new row.")
            rows.append([current_time_str, new_rate])
            
    else:
        # File only has headers, add the first data row
        print(f"Adding initial data row: {new_rate}")
        rows.append([current_time_str, new_rate])
        
    # Write the updated rows back to the CSV
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print("CSV successfully updated.")

if __name__ == "__main__":
    rate = scrape_rate()
    if rate:
        update_csv(rate)
