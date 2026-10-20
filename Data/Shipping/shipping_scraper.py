import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime

# URL filtered for Hambantota destination
URL = "https://autocj.co.jp/japan_shipping_search?hasSearch=1&leavePort=&arrivalPort=Hambantota&shipName=&voyage="

# Relative path matching your repository structure
JSON_FILE = "Data/Shipping/shipping_schedule.json"

def scrape_shipping_schedule():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    
    try:
        print("Connecting to Autocom shipping portal...")
        response = requests.get(URL, headers=headers, timeout=25)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Locate all ship cards via the 'Company:' label
        company_labels = soup.find_all('span', string=re.compile(r"Company:", re.IGNORECASE))
        
        if not company_labels:
            print("Warning: No vessel entries found on page.")
            return []

        schedule_data = []
        
        for label in company_labels:
            # Climb up to the card wrapper
            card = label.find_parent('div', class_=lambda c: c and 'bg-white' in c and 'p-4' in c)
            if not card:
                continue

            # 1. Company / Shipping Line
            company_span = label.find_next_sibling('span')
            shipping_line = company_span.text.strip() if company_span else "Unknown"

            # 2. Vessel Name & Voyage
            ship_span = card.find('span', string=re.compile(r"Ship Name:", re.IGNORECASE))
            ship_name = ship_span.find_next_sibling('span').text.strip() if ship_span else ""
            
            voyage_span = card.find('span', string=re.compile(r"Voyage:", re.IGNORECASE))
            voyage = voyage_span.find_next_sibling('span').text.strip() if voyage_span else ""
            
            vessel_voyage = f"{ship_name} V.{voyage}" if voyage else ship_name

            # 3. Vessel Type
            ship_type = "RO-RO"
            type_badge = card.find('span', string=re.compile(r"RO-RO", re.IGNORECASE))
            if type_badge:
                ship_type = type_badge.text.strip()

            # 4. Departure Ports & Dates
            departures = []
            leave_header = card.find('div', string=re.compile(r"LEAVE", re.IGNORECASE))
            if leave_header:
                leave_container = leave_header.parent
                for row in leave_container.find_all('div', class_=re.compile(r"border")):
                    text = row.text.strip()
                    parts = re.split(r'\s+', text, maxsplit=1)
                    if len(parts) == 2:
                        departures.append({
                            "date": parts[0].strip(),
                            "port": parts[1].strip()
                        })

            # 5. Arrival Port & Date
            arrival = {}
            arrival_header = card.find('div', string=re.compile(r"ARRIVALS", re.IGNORECASE))
            if arrival_header:
                arrival_container = arrival_header.parent
                for row in arrival_container.find_all('div', class_=re.compile(r"border")):
                    text = row.text.strip()
                    parts = re.split(r'\s+', text, maxsplit=1)
                    if len(parts) == 2:
                        arrival = {
                            "date": parts[0].strip(),
                            "port": parts[1].strip()
                        }
                        break

            # Build record if arrival data exists
            if arrival:
                schedule_data.append({
                    "vessel_voyage": vessel_voyage,
                    "type": ship_type,
                    "shipping_line": shipping_line,
                    "departures": departures,
                    "arrival": arrival
                })

        # Sort vessels chronologically by arrival date
        def parse_arrival_date(item):
            try:
                return datetime.strptime(item["arrival"]["date"], "%Y/%m/%d")
            except (KeyError, ValueError):
                return datetime.max

        schedule_data.sort(key=parse_arrival_date)
        return schedule_data

    except requests.RequestException as req_err:
        print(f"Network error while fetching schedule: {req_err}")
        return None
    except Exception as err:
        print(f"Unexpected parsing error: {err}")
        return None

if __name__ == "__main__":
    vessels = scrape_shipping_schedule()
    
    if vessels:
        os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(vessels, f, indent=4, ensure_ascii=False)
        print(f" Successfully written {len(vessels)} vessels to {JSON_FILE}")
    else:
        print("Scraping completed with 0 vessels or encountered an error. JSON was not modified.")
