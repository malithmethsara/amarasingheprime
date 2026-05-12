document.addEventListener("DOMContentLoaded", function() {
    const listUrl = '/auction/nissan/b44w/CSV/list.txt';
    const container = document.getElementById('auctionList');
    
    // Global variable to store images for the lightbox
    window.currentGallery = [];
    window.currentImageIndex = 0;

    // Fetch list.txt with a cache-busting timestamp
    fetch(listUrl + '?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error("Could not find list.txt");
            return response.text();
        })
        .then(text => {
            const files = text.split('\n').map(f => f.trim()).filter(f => f.endsWith('.csv'));
            if (files.length === 0) {
                container.innerHTML = `<div class="loading-state" style="color:var(--muted)">No upcoming units scheduled today.</div>`;
                return;
            }
            container.innerHTML = ''; // Clear loading text
            fetchAllCSVs(files);
        })
        .catch(error => {
            container.innerHTML = `<div class="loading-state" style="color:red">Error syncing auction feed.</div>`;
            console.error("Manifest Error:", error);
        });

    function fetchAllCSVs(files) {
        files.forEach((filename, index) => {
            Papa.parse(`/auction/nissan/b44w/CSV/${filename}?t=` + new Date().getTime(), {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        // Assuming the first row holds the vehicle data
                        renderVehicleCard(results.data[0], filename, index);
                    }
                }
            });
        });
    }

    // Helper: Convert JST to SLST (-3.5 hours)
    function calculateSLST(jstString) {
        if (!jstString) return "N/A";
        // Extract time using regex (e.g., looks for "12:00" or "14:30")
        const timeMatch = jstString.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) return "N/A";

        let hours = parseInt(timeMatch[1]);
        let minutes = parseInt(timeMatch[2]);

        // Subtract 3 hours and 30 minutes
        minutes -= 30;
        if (minutes < 0) {
            minutes += 60;
            hours -= 1;
        }
        hours -= 3;
        if (hours < 0) hours += 24;

        // Format back to HH:MM
        const slstHours = hours.toString().padStart(2, '0');
        const slstMins = minutes.toString().padStart(2, '0');
        return `${slstHours}:${slstMins}`;
    }

    function renderVehicleCard(data, filename, idIndex) {
        // Dynamically find all image columns (Image1, image2, Image3, etc.)
        let images = [];
        const keys = Object.keys(data);
        const imageKeys = keys.filter(k => k.toLowerCase().startsWith('image')).sort();
        
        imageKeys.forEach(key => {
            if (data[key] && data[key].trim() !== "") {
                images.push(data[key].trim());
            }
        });

        const thumbnail = images.length > 0 ? images[0] : '/placeholder.jpg';
        const galleryJson = encodeURIComponent(JSON.stringify(images));
        
        // Calculate Times
        const jstTime = data["Bidding Time JST"] || "N/A";
        const slstTime = calculateSLST(jstTime);

        // Pre-fill WhatsApp message
        const waText = encodeURIComponent(`Hi Amarasinghe Prime!\nI want to bid on this unit:\n\nName: ${data["Name"] || filename}\nAuction: ${data["Auction Details"]}\nChassis: ${data["Chassis No"]}\n\nPlease quote CIF and Taxes.`);
        const waLink = `https://wa.me/94769447740?text=${waText}`;

        const cardHtml = `
        <div class="vehicle-list-card">
            <div class="veh-thumbnail-wrapper" onclick="openLightbox('${galleryJson}', 0)">
                <img src="${thumbnail}" alt="Thumbnail">
                <div class="photo-badge"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> View ${images.length} Photos</div>
            </div>
            
            <div class="veh-data">
                <div>
                    <h3>${data["Name"] || "Premium Auction Unit"}</h3>
                    <div class="auction-detail-text">${data["Auction Details"] || filename.replace('.csv', '')}</div>
                    
                    <div class="time-box">
                        <div class="jst">Japan Time (JST): ${jstTime}</div>
                        <div class="slst">Sri Lanka Time (SLST): ${slstTime !== "N/A" ? slstTime : "Calculate manually"}</div>
                    </div>

                    <table class="specs-table">
                        <tr>
                            <td>Year / Month</td><td>${data["Year/Month"] || "-"}</td>
                            <td>Auction Grade</td><td>${data["Auction Grade"] || "-"}</td>
                        </tr>
                        <tr>
                            <td>Mileage</td><td>${data["Mileage"] || "-"}</td>
                            <td>Colour</td><td>${data["Colour"] || "-"}</td>
                        </tr>
                        <tr>
                            <td>Engine / Fuel</td><td>${data["Engine/ Fuel Type"] || "-"}</td>
                            <td>Drive</td><td>${data["Drive"] || "-"}</td>
                        </tr>
                        <tr>
                            <td>Chassis No.</td><td colspan="3">${data["Chassis No"] || "-"}</td>
                        </tr>
                    </table>
                </div>

                <div class="action-row">
                    <a href="${waLink}" target="_blank" rel="noopener" style="text-decoration: none; flex: 1;">
                        <button class="blue-btn" style="width: 100%; background: #25d366; box-shadow: none;">Message to Bid</button>
                    </a>
                    <button class="outline-btn" style="flex: 1;" onclick="openLightbox('${galleryJson}', ${images.length > 0 ? images.length - 1 : 0})">
                        View Auction Sheet
                    </button>
                </div>
            </div>
        </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHtml);
    }
});

// --- LIGHTBOX LOGIC ---
function openLightbox(galleryJsonStr, startIndex) {
    try {
        window.currentGallery = JSON.parse(decodeURIComponent(galleryJsonStr));
        if (window.currentGallery.length === 0) return;
        
        window.currentImageIndex = startIndex;
        document.getElementById("imageLightbox").style.display = "block";
        document.body.style.overflow = "hidden"; // Prevent scrolling
        updateLightboxImage();
    } catch (e) {
        console.error("Gallery parsing error", e);
    }
}

function closeLightbox() {
    document.getElementById("imageLightbox").style.display = "none";
    document.body.style.overflow = "auto";
}

function changeImage(direction) {
    window.currentImageIndex += direction;
    // Loop around
    if (window.currentImageIndex >= window.currentGallery.length) {
        window.currentImageIndex = 0;
    } else if (window.currentImageIndex < 0) {
        window.currentImageIndex = window.currentGallery.length - 1;
    }
    updateLightboxImage();
}

function updateLightboxImage() {
    const imgEl = document.getElementById("lightboxImg");
    const counterEl = document.getElementById("imageCounter");
    
    imgEl.src = window.currentGallery[window.currentImageIndex];
    
    // If it is the last image, label it as the Auction Sheet
    if (window.currentImageIndex === window.currentGallery.length - 1) {
        counterEl.textContent = "Auction Sheet";
    } else {
        counterEl.textContent = `Photo ${window.currentImageIndex + 1} of ${window.currentGallery.length - 1}`;
    }
}

// Close lightbox on Escape key or clicking outside the image
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") changeImage(1);
    if (event.key === "ArrowLeft") changeImage(-1);
});

document.getElementById("imageLightbox").addEventListener('click', function(event) {
    if (event.target === this) closeLightbox();
});
