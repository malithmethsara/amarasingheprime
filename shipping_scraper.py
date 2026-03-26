import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import os

# The exact URL with the Hambantota filter applied
URL = "https://autocj.co.jp/japan_shipping_search?leave_port=&arrival_port=Hambantota&ship=&leave_date_from=&leave_date_to=&arrival_date_from=&arrival_date_to=&shipsearch=Search"
JSON_FILE = "shipping_schedule.json"

def scrape_shipping_schedule():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        print("Fetching shipping schedule...")
        response = requests.get(URL, headers=headers, timeout=20)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        shipping_sections = soup.find_all('section', class_='shipping')
        
        schedule_data = []
        
        for section in shipping_sections:
            # 1. Extract Vessel Identity
            status_divs = section.find('div', class_='shipstatus').find_all('div')
            shipping_line = status_divs[0].text.strip()
            vessel_voyage = status_divs[1].text.strip()
            ship_type = status_divs[2].text.strip()
            
            # 2. Extract Dates & Ports
            # The HTML has two main blocks under 'shipdate': Leave (index 0) and Arrive (index 1)
            date_blocks = section.find('div', class_='shipdate').find_all('div', recursive=False)
            
            # Parse multiple Departure ports
            leave_block = date_blocks[0]
            leave_ports_html = leave_block.find_all('div', class_='shipping_port')
            departures = []
            for lp in leave_ports_html:
                divs = lp.find_all('div')
                if len(divs) >= 2:
                    departures.append({
                        "date": divs[0].text.strip(),
                        "port": divs[1].text.strip()
                    })
                    
            # Parse Arrival port (usually just one)
            arrive_block = date_blocks[1]
            arrive_port_html = arrive_block.find('div', class_='shipping_port')
            arrive_divs = arrive_port_html.find_all('div')
            arrival = {
                "date": arrive_divs[0].text.strip(),
                "port": arrive_divs[1].text.strip()
            }
            
            # 3. Assemble the grouped dictionary
            schedule_data.append({
                "shipping_line": shipping_line,
                "vessel_voyage": vessel_voyage,
                "type": ship_type,
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
        # Save the data to a JSON file
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            # indent=4 makes the JSON easily readable for humans
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved {len(data)} vessel schedules to {JSON_FILE}")
    else:
        print("No data found or scraping failed.")
