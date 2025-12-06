/*
* Copyright © 2025 Amarasinghe Prime. All Rights Reserved.
* Fully Optimized & Verified Version
*/
(function() {
    'use strict';

    // --- 1. GLOBAL VARIABLES ---
    let resultData = null;
    let taxChart = null;
    let costChart = null;

    // --- 2. DATA TABLES (Verified 2025) ---
    const exciseRates = {
        petrol: [ { min: 600, max: 1000, rate: (cc) => Math.max(2450 * cc, 1992000) }, { max: 1300, rate: 3850 }, { max: 1500, rate: 4450 }, { max: 1600, rate: 5150 }, { max: 1800, rate: 6400 }, { max: 2000, rate: 7700 }, { max: 2500, rate: 8450 }, { max: 2750, rate: 9650 }, { max: 3000, rate: 10850 }, { max: 4000, rate: 12050 }, { max: 6500, rate: 13300 } ],
        petrol_hybrid: [ { min: 600, max: 1000, rate: () => 1810900 }, { max: 1300, rate: 2750 }, { max: 1500, rate: 3450 }, { max: 1600, rate: 4800 }, { max: 1800, rate: 6300 }, { max: 2000, rate: 6900 }, { max: 2500, rate: 7250 }, { max: 2750, rate: 8450 }, { max: 3000, rate: 9650 }, { max: 4000, rate: 10850 }, { max: 6500, rate: 12050 } ],
        petrol_plugin: [ { min: 600, max: 1000, rate: () => 1810900 }, { max: 1300, rate: 2750 }, { max: 1500, rate: 3450 }, { max: 1600, rate: 4800 }, { max: 1800, rate: 6250 }, { max: 2000, rate: 6900 }, { max: 2500, rate: 7250 }, { max: 2750, rate: 8450 }, { max: 3000, rate: 9650 }, { max: 4000, rate: 10850 }, { max: 6500, rate: 12050 } ],
        diesel: [ { min: 900, max: 1500, rate: 5500 }, { max: 1600, rate: 6950 }, { max: 1800, rate: 8300 }, { max: 2000, rate: 9650 }, { max: 2500, rate: 9650 }, { max: 2750, rate: 10850 }, { max: 3000, rate: 12050 }, { max: 4000, rate: 13300 }, { max: 6500, rate: 14500 } ],
        diesel_hybrid: [ { min: 900, max: 1000, rate: 4150 }, { max: 1500, rate: 4150 }, { max: 1600, rate: 5500 }, { max: 1800, rate: 6900 }, { max: 2000, rate: 8350 }, { max: 2500, rate: 8450 }, { max: 2750, rate: 9650 }, { max: 3000, rate: 10850 }, { max: 4000, rate: 12050 }, { max: 6500, rate: 13300 } ],
        diesel_plugin: [ { min: 900, max: 1000, rate: 4150 }, { max: 1500, rate: 4150 }, { max: 1600, rate: 5500 }, { max: 1800, rate: 6900 }, { max: 2000, rate: 8300 }, { max: 2500, rate: 8450 }, { max: 2750, rate: 9650 }, { max: 3000, rate: 10850 }, { max: 4000, rate: 12050 }, { max: 6500, rate: 13300 } ],
        electric: [ { min: 1, max: 50, rate: (age) => age === '1' ? 18100 : 36200 }, { max: 100, rate: (age) => age === '1' ? 24100 : 36200 }, { max: 200, rate: (age) => age === '1' ? 36200 : 60400 }, { max: 600, rate: (age) => age === '1' ? 96600 : 132800 } ],
        esmart_petrol: [ { min: 1, max: 50, rate: (age) => age === '1' ? 30770 : 43440 }, { max: 100, rate: (age) => age === '1' ? 40970 : 43440 }, { max: 200, rate: (age) => age === '1' ? 41630 : 63420 }, { max: 600, rate: (age) => age === '1' ? 111090 : 139440 } ],
        esmart_diesel: [ { min: 1, max: 50, rate: (age) => age === '1' ? 36920 : 52130 }, { max: 100, rate: (age) => age === '1' ? 49160 : 52130 }, { max: 200, rate: (age) => age === '1' ? 49960 : 76100 }, { max: 600, rate: (age) => age === '1' ? 133310 : 167330 } ]
    };
    const luxuryThresholds = { petrol: 5000000, diesel: 5000000, petrol_hybrid: 5500000, diesel_hybrid: 5500000, petrol_plugin: 5500000, diesel_plugin: 5500000, electric: 6000000, esmart_petrol: 6000000, esmart_diesel: 6000000 };
    const luxuryRates = { petrol: 1.0, diesel: 1.2, petrol_hybrid: 0.8, diesel_hybrid: 0.8, petrol_plugin: 0.8, diesel_plugin: 0.8, electric: 0.6, esmart_petrol: 0.6, esmart_diesel: 0.6 };

    // --- 3. UTILITIES ---
    function getElementSafe(id) { return document.getElementById(id) || null; }
    function formatNumber(num) { return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

    function showError(fieldId, message) {
        const input = getElementSafe(fieldId); if (!input) return;
        const err = document.createElement('div'); err.className = 'error-message'; err.textContent = message;
        const existing = input.parentNode.querySelector('.error-message'); if(existing) existing.remove();
        input.parentNode.insertBefore(err, input.nextSibling); input.focus();
    }
    function clearErrors() { document.querySelectorAll('.error-message').forEach(el => el.remove()); }

    // --- 4. SMART LOADER (Downloads scripts only when needed) ---
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // --- 5. LIVE CLOCK ---
    function startLiveClock() {
        const timeEl = getElementSafe('timeDateTime');
        if (timeEl) {
            const updateTime = () => {
                timeEl.textContent = new Date().toLocaleString('en-LK', { 
                    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
                });
            };
            updateTime(); setInterval(updateTime, 1000);
        }
    }

    // --- 6. REVIEW DATE CALCULATOR ---
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
        interval = Math.floor(seconds / 604800);
        if (interval >= 1) return interval + " week" + (interval === 1 ? "" : "s") + " ago";
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
        return "Just now";
    }

    function updateReviewTimes() {
        const reviews = document.querySelectorAll('.r-meta[data-date]');
        reviews.forEach(review => {
            const date = review.getAttribute('data-date');
            if (date) review.textContent = timeAgo(date);
        });
    }

    // --- 7. CALCULATOR LOGIC ---
    function calculateExcise(type, capacity, age) {
        const table = exciseRates[type];
        if (!table) return { error: 'Invalid vehicle type' };
        
        let minCapacity = 900, maxCapacity = 6500;
        if (type.includes('electric') || type.includes('esmart')) { minCapacity = 1; maxCapacity = 600; } 
        else if (type.includes('petrol')) { minCapacity = 600; }

        if (capacity < minCapacity || capacity > maxCapacity) return { error: `! Please enter valid capacity (${minCapacity}–${maxCapacity})` };

        for (let tier of table) {
            const tierMin = tier.min || minCapacity;
            const tierMax = tier.max || maxCapacity;
            if (capacity >= tierMin && capacity <= tierMax) {
                const rateFn = tier.rate;
                if (['petrol_hybrid', 'petrol_plugin'].includes(type) && capacity <= 1000 && tier.min === 600) return 1810900;
                if (type === 'petrol' && capacity <= 1000 && tier.min === 600) return typeof rateFn === 'function' ? rateFn(capacity) : rateFn * capacity;
                if (type.includes('electric') || type.includes('esmart')) return (typeof rateFn === 'function' ? rateFn(age) : rateFn) * capacity;
                return (typeof rateFn === 'function' ? rateFn() : rateFn) * capacity;
            }
        }
        return 0;
    }

    function calculateLuxuryTax(cif, type) { 
        const threshold = luxuryThresholds[type] || 5000000; 
        const rate = luxuryRates[type] || 1.0; 
        return cif > threshold ? (cif - threshold) * rate : 0; 
    }

    function calculateTax() {
        clearErrors();
        const els = {
            cif: getElementSafe('cifJPY'), rate: getElementSafe('exchangeRate'),
            type: getElementSafe('vehicleType'), cap: getElementSafe('capacity'),
            age: getElementSafe('age'), dealer: getElementSafe('dealerFee'),
            clearing: getElementSafe('clearingFee')
        };
        if (!els.cif) return;

        const cifJPY = parseFloat(els.cif.value) || 0;
        const exchangeRate = parseFloat(els.rate.value) || 0;
        const type = els.type.value;
        const capacity = parseFloat(els.cap.value) || 0;
        const age = els.age.value;
        const dealerFee = parseFloat(els.dealer.value) || 0;
        const clearingFee = parseFloat(els.clearing.value) || 0;

        if (cifJPY < 800000) return showError('cifJPY', '! Please enter valid CIF');
        if (!type) return showError('vehicleType', '! Select type');

        const cif = cifJPY * exchangeRate;
        const exciseResult = calculateExcise(type, capacity, age);
        if (exciseResult.error) return showError('capacity', exciseResult.error);

        const cid = cif * 0.20;
        const surcharge = cid * 0.50;
        const excise = exciseResult;
        const luxuryTax = calculateLuxuryTax(cif, type);
        const vel = 15000;
        const vatBase = (cif * 1.1) + cid + surcharge + excise + luxuryTax;
        const vat = vatBase * 0.18;
        const totalTax = cid + surcharge + excise + luxuryTax + vel + vat;
        const totalCost = cif + totalTax + dealerFee + clearingFee;

        resultData = { cifJPY, exchangeRate, cif, type, capacity, age, dealerFee, clearingFee, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges: dealerFee + clearingFee, totalCost };

        displayResults(resultData);
        
        // --- LOAD CHARTS ON DEMAND ---
        loadScript('https://cdn.jsdelivr.net/npm/chart.js').then(() => {
            showCharts(resultData);
        });

        const dlBtn = getElementSafe('downloadBtn'); if (dlBtn) dlBtn.style.display = 'flex';
        const resEl = getElementSafe('result'); if (resEl) requestAnimationFrame(() => resEl.scrollIntoView({ behavior: 'smooth' }));
    }

    function displayResults(data) {
        const unit = data.type.includes('electric') || data.type.includes('esmart') ? 'kW' : 'cc';
        const html = `
            <div style="font-weight:700;margin-bottom:0.75rem;color:var(--primary);font-size:1.1rem">Inputs Summary</div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff"><tr><th style="padding:0.6rem;text-align:left">Input Description</th><th style="padding:0.6rem;text-align:right">Value</th></tr></thead>
                <tbody>
                    <tr><td style="padding:0.5rem">CIF (JPY)</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cifJPY)}</td></tr>
                    <tr><td style="padding:0.5rem">Exchange Rate</td><td style="text-align:right;padding:0.5rem">${data.exchangeRate.toFixed(4)}</td></tr>
                    <tr><td style="padding:0.5rem">CIF (LKR)</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cif)}</td></tr>
                    <tr><td style="padding:0.5rem">Capacity</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.capacity)} ${unit}</td></tr>
                </tbody>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:var(--primary);font-size:1.1rem">Tax Breakdown</div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff"><tr><th style="padding:0.6rem;text-align:left">Tax Type</th><th style="padding:0.6rem;text-align:right">Amount (LKR)</th></tr></thead>
                <tbody>
                    <tr><td style="padding:0.5rem">Customs Import Duty</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cid)}</td></tr>
                    <tr><td style="padding:0.5rem">Surcharge</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.surcharge)}</td></tr>
                    <tr><td style="padding:0.5rem">Excise Duty</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.excise)}</td></tr>
                    <tr><td style="padding:0.5rem">Luxury Tax</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.luxuryTax)}</td></tr>
                    <tr><td style="padding:0.5rem">VEL</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.vel)}</td></tr>
                    <tr><td style="padding:0.5rem">VAT</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.vat)}</td></tr>
                </tbody>
                <tfoot style="background:#f0f4fa; font-weight:700;">
                    <tr><td style="padding:0.6rem">Total Taxes</td><td style="text-align:right;padding:0.6rem">${formatNumber(data.totalTax)}</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.5rem 0 0.5rem 0;color:var(--primary);font-size:1.1rem">Final Cost Summary</div>
            <table style="width:100%;border-collapse:collapse">
                <thead style="background:var(--primary);color:#fff">
                    <tr><th style="padding:0.6rem;text-align:left">Cost Component</th><th style="padding:0.6rem;text-align:right">Amount (LKR)</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Vehicle CIF Value</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Total Taxes & Duties</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.totalTax)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Other Charges (Dealer & Clearing Fee)</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.otherCharges)}</td></tr>
                </tbody>
                <tfoot style="background:#e3edfb;border-top:2px solid var(--primary)">
                    <tr><td style="padding:0.6rem;font-weight:700;font-size:1.1rem">TOTAL IMPORT COST</td><td style="text-align:right;padding:0.6rem;font-weight:700;font-size:1.1rem">${formatNumber(data.totalCost)}</td></tr>
                </tfoot>
            </table>
        `;
        const resultEl = getElementSafe('result'); if (resultEl) resultEl.innerHTML = html;
    }

    function showCharts(data) {
        const ctx1 = getElementSafe('taxPieChart'); const ctx2 = getElementSafe('pieChart');
        if (!ctx1 || !ctx2 || !window.Chart) return;
        
        if (taxChart) taxChart.destroy();
        if (costChart) costChart.destroy();

        taxChart = new Chart(ctx1, { type: 'pie', data: { labels: ['CID', 'Surcharge', 'Excise', 'Lux', 'VEL', 'VAT'], datasets: [{ data: [data.cid, data.surcharge, data.excise, data.luxuryTax, data.vel, data.vat], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }] } });
        costChart = new Chart(ctx2, { type: 'pie', data: { labels: ['CIF', 'Taxes', 'Other'], datasets: [{ data: [data.cif, data.totalTax, data.otherCharges], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }] } });
    }

    // --- 8. PDF DOWNLOAD (Safe On-Demand Loading) ---
    function downloadPDF() {
        if (!resultData) return alert('Calculate tax first.');
        const btn = getElementSafe('downloadBtn');
        btn.textContent = 'Loading PDF...';
        btn.disabled = true;

        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
        ]).then(() => {
            setTimeout(() => generatePDF(btn), 100);
        }).catch(() => {
            btn.textContent = 'Error';
            btn.disabled = false;
            alert("Error loading PDF tools. Please check your connection.");
        });
    }

    function generatePDF(btn) {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF();
        
        doc.setFontSize(14);
        doc.text('Sri Lanka Vehicle Tax Calculation 2025', 10, 10);
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 18);

        // Inputs
        doc.autoTable({
            startY: 25,
            head: [['Input Description', 'Value']],
            body: [
                ['CIF (JPY)', formatNumber(resultData.cifJPY)],
                ['Exchange Rate', resultData.exchangeRate.toFixed(4)],
                ['CIF (LKR)', formatNumber(resultData.cif)],
                ['Capacity', `${formatNumber(resultData.capacity)}`],
                ['Vehicle Type', resultData.type.toUpperCase()]
            ]
        });

        // Totals
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Cost Component', 'Amount (LKR)']],
            body: [
                ['Vehicle CIF Value', formatNumber(resultData.cif)],
                ['Total Taxes & Duties', formatNumber(resultData.totalTax)],
                ['Other Charges', formatNumber(resultData.otherCharges)],
                ['TOTAL IMPORT COST', formatNumber(resultData.totalCost)]
            ]
        });

        doc.save('vehicle_tax_estimate.pdf');
        btn.textContent = 'Save as PDF';
        btn.disabled = false;
    }

    // --- 9. INITIALIZATION ---
    function init() {
        console.log('App Loaded');
        startLiveClock();
        updateReviewTimes(); 
        
        fetch('rates.txt').then(r => r.text()).then(t => {
            const lines = t.trim().split('\n');
            if (lines.length > 0) {
                const parts = lines[lines.length - 1].split(',');
                if (parts.length >= 2) {
                    const rate = parseFloat(parts[1].trim());
                    const el = getElementSafe('exchangeRate'); if (el) el.value = rate;
                    const msg = getElementSafe('cbslRate'); if (msg) msg.innerHTML = `Exchange Rate: JPY/LKR = ${rate.toFixed(4)}`;
                }
            }
        });

        const btn = getElementSafe('calculateBtn'); if (btn) btn.addEventListener('click', calculateTax);
        const dl = getElementSafe('downloadBtn'); if (dl) dl.addEventListener('click', downloadPDF);
        const reset = getElementSafe('resetBtn'); if (reset) reset.addEventListener('click', () => location.reload());
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
