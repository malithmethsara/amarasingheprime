import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime
import os
import re
import io
from pdf2image import convert_from_bytes
import pytesseract

URL = "https://www.customs.gov.lk/exchange-rates/"
CSV_FILE = "Data/Rates/SLC/SLC-rates.csv"

def get_latest_pdf_url():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        print("Fetching Sri Lanka Customs page...")
        response = requests.get(URL, headers=headers, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.lower().endswith('.pdf'):
                print(f"Found latest PDF: {href}")
                return href
        return None
    except Exception as e:
        print(f"Error finding PDF link: {e}")
        return None

def extract_jpy_rate(pdf_url):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        print("Downloading PDF...")
        response = requests.get(pdf_url, headers=headers, timeout=20)
        response.raise_for_status()
        
        print("Converting PDF to images for OCR scan...")
        # Converts the PDF document into readable images
        images = convert_from_bytes(response.content)
        
        text = ""
        for i, image in enumerate(images):
            print(f"Scanning page {i+1}...")
            # Reads the text off the image
            text += pytesseract.image_to_string(image) + "\n"
        
        # Looks for "JPY", ignores any text/spaces/symbols, and grabs the first decimal number
        match = re.search(r'JPY[^\d]*([0-9]+\.[0-9]+)', text)
        
        if match:
            return match.group(1).strip()
        else:
            print("Could not find the JPY rate in the scanned text.")
            return None
            
    except Exception as e:
        print(f"Error extracting data from PDF: {e}")
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
            rows = [row for row in reader if len(row) >= 2]
            
    if not rows:
        rows = [["Date", "SLC_JPY_Exchange_Rate"]]
        
    if len(rows) > 1:
        last_row = rows[-1]
        last_date_str = last_row[0]
        last_rate = last_row[1]
        
        if new_rate == last_rate:
            print(f"Rate {new_rate} is unchanged from the last recorded rate. Skipping.")
            return

        if last_date_str == current_date_str:
            print(f"Rate changed today! Overwriting today's entry.")
            rows[-1] = [current_date_str, new_rate]
        else:
            print(f"New rate {new_rate} found. Appending to CSV.")
            rows.append([current_date_str, new_rate])
            
    else:
        rows.append([current_date_str, new_rate])
        
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print("CSV successfully updated.")

if __name__ == "__main__":
    pdf_url = get_latest_pdf_url()
    if pdf_url:
        rate = extract_jpy_rate(pdf_url)
        if rate:
            print(f"Successfully extracted SLC JPY Rate: {rate}")
            update_csv(rate)
