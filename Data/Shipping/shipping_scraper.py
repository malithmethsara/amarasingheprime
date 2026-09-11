import requests
from bs4 import BeautifulSoup
import json
import os
import re

# The new, simplified URL with the Hambantota destination parameter
URL = "https://autocj.co.jp/japan_shipping_search?hasSearch=1&leavePort=&arrivalPort=Hambantota&shipName=&voyage="

# Path where the JSON will be saved
JSON_FILE = "Data/Shipping/shipping_schedule.json"

def scrape_shipping_schedule():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        print("Fetching shipping schedule from new Autocom site...")
        response = requests.get(URL, headers=headers, timeout=20)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all labels that say "Company:" to locate each individual ship card
        company_labels = soup.find_all('span', string=re.compile("Company:"))
        
        schedule_data = []
        
        for label in company_labels:
            # 1. Navigate up the HTML tree to grab the entire "Card" container for this specific ship
            card = label.find_parent('div', class_=lambda c: c and 'bg-white' in c and 'p-4' in c)
            if not card:
                continue

            # 2. Extract Vessel Identity using next siblings
            shipping_line = label.find_next_sibling('span').text.strip()
            
            ship_span = card.find('span', string=re.compile("Ship Name:"))
            ship_name = ship_span.find_next_sibling('span').text.strip() if ship_span else ""
            
            voyage_span = card.find('span', string=re.compile("Voyage:"))
            voyage = voyage_span.find_next_sibling('span').text.strip() if voyage_span else ""
            
            vessel_voyage = f"{ship_name} V.{voyage}" if voyage else ship_name
            
            # Default to RO-RO, but attempt to extract the badge if available
            ship_type = "RO-RO"
            type_badge = card.find('span', string=re.compile("RO-RO"))
            if type_badge:
                ship_type = type_badge.text.strip()

            # 3. Extract Departures
            departures = []
            leave_header = card.find('div', string=re.compile("LEAVE"))
            if leave_header:
                leave_container = leave_header.parent
                # Loop through all rows inside the LEAVE container
                for row in leave_container.find_all('div', class_=re.compile("border")):
                    text = row.text.strip()
                    parts = text.split(' ', 1) # Splits "2026/07/30 YOKOHAMA" into ["2026/07/30", "YOKOHAMA"]
                    if len(parts) == 2:
                        departures.append({
                            "date": parts[0],
                            "port": parts[1]
                        })

            # 4. Extract Arrival (Hambantota)
            arrival = {}
            arrival_header = card.find('div', string=re.compile("ARRIVALS"))
            if arrival_header:
                arrival_container = arrival_header.parent
                for row in arrival_container.find_all('div', class_=re.compile("border")):
                    text = row.text.strip()
                    parts = text.split(' ', 1)
                    if len(parts) == 2:
                        arrival = {
                            "date": parts[0],
                            "port": parts[1]
                        }
                        break # We only need the first arrival port (Hambantota)

            # 5. Assemble the dictionary
            schedule_data.append({
                "vessel_voyage": vessel_voyage,
                "type": ship_type,
                "shipping_line": shipping_line,
                "departures": departures,
                "arrival": arrival
            })
            
        return schedule_data

    except Exception as e:
        print(f"Error scraping shipping data: {e}")
        return None

if __name__ == "__main__":
    data = scrape_shipping_schedule()
    
    if data:
        # Ensures the Data/Shipping folder exists before saving
        os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
        
        # Save the data to a JSON file
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved {len(data)} vessel schedules to {JSON_FILE}")
    else:
        print("No data found or scraping failed.")
