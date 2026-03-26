import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime
import os
import re

URL = "https://www.cbsl.gov.lk/cbsl_custom/charts/jpy/indexsmall.php"
CSV_FILE = "jpy_lkr_rates.csv"

def scrape_rate():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        text_content = soup.get_text(separator=" ")
        
        # Searches for "Sell" followed by spaces and numbers
        match = re.search(r'Sell\s+([\d\.]+)', text_content)
        
        if match:
            selling_rate = match.group(1).strip()
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return [now, selling_rate]
        return None

    except Exception as e:
        print(f"Error: {e}")
        return None

def save_to_csv(data):
    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "JPY_LKR_Selling_Rate"])
        writer.writerow(data)

if __name__ == "__main__":
    result = scrape_rate()
    if result:
        save_to_csv(result)
