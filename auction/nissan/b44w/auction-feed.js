document.addEventListener("DOMContentLoaded", function() {
    const csvUrl = 'csv/data.csv'; // Must be uploaded to /auction/nissan/b44w/csv/data.csv
    const grid = document.getElementById('auctionGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let allVehicles = [];

    // Initialize PapaParse to read the CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processAuctionData(results.data);
        },
        error: function(error) {
            grid.innerHTML = `<div class="empty-state">Error loading auction data. Please try again later.</div>`;
            console.error("CSV Parse Error:", error);
        }
    });

    function processAuctionData(data) {
        const now = new Date(); // Current Time
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        allVehicles = [];

        data.forEach(row => {
            // Extract the Date string (e.g., "12.05.2026 11:59")
            const rawInfo = row["Lot Number/ Auction House/ Auction Date"];
            if (!rawInfo) return;

            // Regex to grab the date "DD.MM.YYYY"
            const dateMatch = rawInfo.match(/(\d{2})\.(\d{2})\.(\d{4})/);
            if (!dateMatch) return;

            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
            const year = parseInt(dateMatch[3]);
            
            const auctionDate = new Date(year, month, day);

            // AUTO-DELETE: If the auction date is BEFORE today, skip this vehicle
            if (auctionDate < todayAtMidnight) return;

            // Calculate "Days from today" for filtering
            const timeDiff = auctionDate.getTime() - todayAtMidnight.getTime();
            const daysDifference = Math.floor(timeDiff / (1000 * 3600 * 24));

            // Extract Lot Number
            const lotMatch = rawInfo.match(/Lot (\d+)/);
            const lotNumber = lotMatch ? lotMatch[1] : "N/A";

            // Extract Images (up to 5)
            const images = [
                row["Image"],
                row["lazy-image__img src 2"],
                row["lazy-image__img src 3"],
                row["lazy-image__img src 4"],
                row["lazy-image__img src 5"]
            ].filter(img => img && img.trim() !== "");

            allVehicles.push({
                model: row["Model"],
                lot: lotNumber,
                rawInfo: rawInfo,
                grade: row["Auction Grade"],
                yearMonth: row["Year/ Month"],
                mileage: row["Mileage"],
                color: row["Colour"],
                images: images,
                daysFromToday: daysDifference,
                formattedDate: `${day.toString().padStart(2, '0')}.${(month+1).toString().padStart(2, '0')}.${year}`
            });
        });

        renderGrid(allVehicles);
    }

    function renderGrid(vehicles) {
        if (vehicles.length === 0) {
            grid.innerHTML = `<div class="empty-state">No upcoming units available for this selection. Check back tomorrow!</div>`;
            return;
        }

        let html = '';
        vehicles.forEach(car => {
            
            // Build Mini-Slider HTML
            let imagesHtml = '';
            let dotsHtml = '';
            car.images.forEach((img, index) => {
                imagesHtml += `<img src="${img}" alt="Auction Image ${index + 1}" loading="lazy">`;
                dotsHtml += `<div class="dot ${index === 0 ? 'active' : ''}"></div>`;
            });

            // Build WhatsApp Message Link
            const waText = encodeURIComponent(`Hi Amarasinghe Prime! I am interested in bidding on the following unit from the portal:\n\nModel: ${car.model}\nLot Number: ${car.lot}\nAuction Date: ${car.formattedDate}\n\nPlease provide an estimated CIF/Tax calculation.`);
            const waLink = `https://wa.me/94769447740?text=${waText}`;

            html += `
            <div class="vehicle-card" style="margin: 0;">
                <div class="card-gallery-wrapper">
                    <div class="card-gallery" onscroll="updateDots(this)">
                        ${imagesHtml}
                    </div>
                    <div class="gallery-dots">
                        ${dotsHtml}
                    </div>
                </div>
                <div class="veh-info">
                    <h3 style="font-size: 1rem; margin-bottom: 0.5rem; text-align:left; line-height: 1.3;">${car.model}</h3>
                    
                    <div style="font-size: 0.85rem; color: #d32f2f; font-weight: 700; margin-bottom: 0.8rem;">
                        Auction: ${car.formattedDate} | Lot: ${car.lot}
                    </div>

                    <div class="veh-specs-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 1rem;">
                        <div class="spec-item" title="Year/Month"><span class="spec-icon">📅</span> ${car.yearMonth}</div>
                        <div class="spec-item" title="Mileage"><span class="spec-icon">🛣️</span> ${car.mileage}</div>
                        <div class="spec-item" title="Colour"><span class="spec-icon">🎨</span> ${car.color}</div>
                        <div class="spec-item" title="Auction Grade"><span class="spec-icon">📊</span> Grade ${car.grade}</div>
                    </div>

                    <a href="${waLink}" target="_blank" rel="noopener" style="text-decoration: none;">
                        <button class="veh-btn" style="background: #25d366; border-color: #25d366; color: white;">
                            Message to Bid 
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-left: 5px;"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-26.5l-6.7-4.2-69.8 18.3 18.6-68.1-4.4-6.9c-18.3-29.1-28-63.1-28-97.6 0-101.9 82.9-184.8 184.8-184.8 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/></svg>
                        </button>
                    </a>
                </div>
            </div>
            `;
        });

        grid.innerHTML = html;
    }

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filterType = this.getAttribute('data-filter');
            
            let filteredList = [];
            if (filterType === 'all') {
                filteredList = allVehicles;
            } else if (filterType === 'tomorrow') {
                filteredList = allVehicles.filter(car => car.daysFromToday === 1);
            } else if (filterType === 'dayafter') {
                filteredList = allVehicles.filter(car => car.daysFromToday === 2);
            }

            renderGrid(filteredList);
        });
    });
});

// Sync image swipe position with the dots
function updateDots(galleryElement) {
    const scrollPosition = galleryElement.scrollLeft;
    const width = galleryElement.offsetWidth;
    const activeIndex = Math.round(scrollPosition / width);
    
    const dots = galleryElement.nextElementSibling.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}
