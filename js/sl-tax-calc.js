/*
* Copyright © 2025 Amarasinghe Prime. All Rights Reserved.
* Official Calculation Logic - Adjusted for 2025 Gazette & Real World CUSDEC
* Updated: Switched to CBSL Daily Rates (CBSL rates.txt)
*/
(function() {
    'use strict';

    // 1. Global Variables
    let resultData = null;
    let taxChart = null;
    let costChart = null;

    // 2. EXCISE DUTY TABLES — VERIFIED WITH 2025 GAZETTE
    const exciseRates = {
        petrol: [
            { min: 600, max: 1000, rate: (cc) => Math.max(2450 * cc, 1992000) },
            { max: 1300, rate: 3850 },
            { max: 1500, rate: 4450 },
            { max: 1600, rate: 5150 },
            { max: 1800, rate: 6400 },
            { max: 2000, rate: 7700 },
            { max: 2500, rate: 8450 },
            { max: 2750, rate: 9650 },
            { max: 3000, rate: 10850 },
            { max: 4000, rate: 12050 },
            { max: 6500, rate: 13300 }
        ],
        petrol_hybrid: [
            { min: 600, max: 1000, rate: () => 1810900 },
            { max: 1300, rate: 2750 },
            { max: 1500, rate: 3450 },
            { max: 1600, rate: 4800 },
            { max: 1800, rate: 6300 },
            { max: 2000, rate: 6900 },
            { max: 2500, rate: 7250 },
            { max: 2750, rate: 8450 },
            { max: 3000, rate: 9650 },
            { max: 4000, rate: 10850 },
            { max: 6500, rate: 12050 }
        ],
        petrol_plugin: [
            { min: 600, max: 1000, rate: () => 1810900 },
            { max: 1300, rate: 2750 },
            { max: 1500, rate: 3450 },
            { max: 1600, rate: 4800 },
            { max: 1800, rate: 6250 },
            { max: 2000, rate: 6900 },
            { max: 2500, rate: 7250 },
            { max: 2750, rate: 8450 },
            { max: 3000, rate: 9650 },
            { max: 4000, rate: 10850 },
            { max: 6500, rate: 12050 }
        ],
        diesel: [
            { min: 900, max: 1500, rate: 5500 },
            { max: 1600, rate: 6950 },
            { max: 1800, rate: 8300 },
            { max: 2000, rate: 9650 },
            { max: 2500, rate: 9650 },
            { max: 2750, rate: 10850 },
            { max: 3000, rate: 12050 },
            { max: 4000, rate: 13300 },
            { max: 6500, rate: 14500 }
        ],
        diesel_hybrid: [
            { min: 900, max: 1000, rate: 4150 },
            { max: 1500, rate: 4150 },
            { max: 1600, rate: 5500 },
            { max: 1800, rate: 6900 },
            { max: 2000, rate: 8350 },
            { max: 2500, rate: 8450 },
            { max: 2750, rate: 9650 },
            { max: 3000, rate: 10850 },
            { max: 4000, rate: 12050 },
            { max: 6500, rate: 13300 }
        ],
        diesel_plugin: [
            { min: 900, max: 1000, rate: 4150 },
            { max: 1500, rate: 4150 },
            { max: 1600, rate: 5500 },
            { max: 1800, rate: 6900 },
            { max: 2000, rate: 8300 },
            { max: 2500, rate: 8450 },
            { max: 2750, rate: 9650 },
            { max: 3000, rate: 10850 },
            { max: 4000, rate: 12050 },
            { max: 6500, rate: 13300 }
        ],
        electric: [
            { min: 1, max: 50, rate: (age) => age === '1' ? 18100 : 36200 },
            { max: 100, rate: (age) => age === '1' ? 24100 : 36200 },
            { max: 200, rate: (age) => age === '1' ? 36200 : 60400 },
            { max: 600, rate: (age) => age === '1' ? 96600 : 132800 }
        ],
        esmart_petrol: [
            { min: 1, max: 50, rate: (age) => age === '1' ? 30770 : 43440 },
            { max: 100, rate: (age) => age === '1' ? 40970 : 43440 },
            { max: 200, rate: (age) => age === '1' ? 41630 : 63420 },
            { max: 600, rate: (age) => age === '1' ? 111090 : 139440 }
        ],
        esmart_diesel: [
            { min: 1, max: 50, rate: (age) => age === '1' ? 36920 : 52130 },
            { max: 100, rate: (age) => age === '1' ? 49160 : 52130 },
            { max: 200, rate: (age) => age === '1' ? 49960 : 76100 },
            { max: 600, rate: (age) => age === '1' ? 133310 : 167330 }
        ]
    };

    // 3. Luxury Tax Thresholds & Rates
    const luxuryThresholds = {
        petrol: 5000000, diesel: 5000000,
        petrol_hybrid: 5500000, diesel_hybrid: 5500000,
        petrol_plugin: 5500000, diesel_plugin: 5500000,
        electric: 6000000, esmart_petrol: 6000000, esmart_diesel: 6000000
    };
    const luxuryRates = {
        petrol: 1.0, diesel: 1.2,
        petrol_hybrid: 0.8, diesel_hybrid: 0.8,
        petrol_plugin: 0.8, diesel_plugin: 0.8,
        electric: 0.6, esmart_petrol: 0.6, esmart_diesel: 0.6
    };

    // 4. Utility Functions
    function formatNumber(num, decimals = 0) {
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    function showError(fieldId, message) {
        clearErrors();
        const input = document.getElementById(fieldId);
        if (!input) return;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    function getElementSafe(id) {
        return document.getElementById(id) || null;
    }

    // --- LIVE CLOCK ---
    function startLiveClock() {
        const timeEl = getElementSafe('timeDateTime');
        if (timeEl) {
            const updateTime = () => {
                const now = new Date();
                const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                const monthName = now.toLocaleDateString('en-US', { month: 'short' });
                const dateNum = now.getDate();
                let suffix = "th";
                if (dateNum === 1 || dateNum === 21 || dateNum === 31) suffix = "st";
                else if (dateNum === 2 || dateNum === 22) suffix = "nd";
                else if (dateNum === 3 || dateNum === 23) suffix = "rd";
                const year = now.getFullYear();
                const timeString = now.toLocaleTimeString('en-US', {
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit', 
                    hour12: true 
                });
                timeEl.textContent = `${dayName} ${dateNum}${suffix} ${monthName} ${year} ${timeString}`;
            };
            updateTime();
            setInterval(updateTime, 1000);
        }
    }

    // --- REVIEW DATE CALCULATOR ---
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

    // 4.1. Lazy Load External Scripts
    function loadExternalScript(url, globalCheck) {
        return new Promise((resolve, reject) => {
            if (window[globalCheck]) { resolve(); return; }
            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => { resolve(); };
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // --- SMART LOADER (For PDF/Charts) ---
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

    // 5. Calculate Excise Duty
    function calculateExcise(type, capacity, age) {
        const table = exciseRates[type];
        if (!table) return { error: 'Invalid vehicle type' };

        let minCapacity, maxCapacity;
        if (type.includes('electric') || type.includes('esmart')) { minCapacity = 1; maxCapacity = 600; } 
        else if (type.includes('petrol')) { minCapacity = 600; maxCapacity = 6500; } 
        else if (type.includes('diesel')) { minCapacity = 900; maxCapacity = 6500; } 
        else { return { error: 'Invalid vehicle type' }; }

        if (capacity < minCapacity || capacity > maxCapacity) {
            return { error: `! Please enter valid capacity (${minCapacity}–${maxCapacity})` };
        }

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

    // 6. Calculate Luxury Tax
    function calculateLuxuryTax(cif, type) {
        const threshold = luxuryThresholds[type] || 5000000;
        const rate = luxuryRates[type] || 1.0;
        return cif > threshold ? (cif - threshold) * rate : 0;
    }

    // 7. Main Calculation (THE REAL WORLD FORMULA)
    function calculateTax() {
        clearErrors();
        const elements = {
            cifJPY: getElementSafe('cifJPY'),
            exchangeRate: getElementSafe('exchangeRate'),
            vehicleType: getElementSafe('vehicleType'),
            capacity: getElementSafe('capacity'),
            age: getElementSafe('age'),
            dealerFee: getElementSafe('dealerFee'),
            clearingFee: getElementSafe('clearingFee'),
            bankFee: getElementSafe('bankLcFee') 
        };

        if (!elements.cifJPY || !elements.exchangeRate || !elements.vehicleType || !elements.capacity || !elements.age) {
            showError('cifJPY', 'Form elements not found - reload page');
            return;
        }

        const cifJPY = parseFloat(elements.cifJPY.value) || 0;
        const exchangeRate = parseFloat(elements.exchangeRate.value) || 0;
        const type = elements.vehicleType.value;
        const capacity = parseFloat(elements.capacity.value) || 0;
        const age = elements.age.value;
        const dealerFee = parseFloat(elements.dealerFee.value) || 0;
        const clearingFee = parseFloat(elements.clearingFee.value) || 0;
        const bankFee = parseFloat(elements.bankFee ? elements.bankFee.value : 0) || 0;

        // --- VALIDATION ---
        if (cifJPY < 800000 || cifJPY > 20000000) return showError('cifJPY', '! Please enter valid CIF (JPY) amount');
        if (exchangeRate < 1.6 || exchangeRate > 2.9) return showError('exchangeRate', '! Please enter valid Exchange Rate');
        if (!type) return showError('vehicleType', '! Please select vehicle type');
        if (capacity <= 0) return showError('capacity', '! Please enter valid capacity');
        if (!age) return showError('age', '! Please select vehicle age');

        const cif = cifJPY * exchangeRate;
        const exciseResult = calculateExcise(type, capacity, age);
        if (exciseResult.error) return showError('capacity', exciseResult.error);

        // 1. Customs Import Duty (CID)
        const cid = cif * 0.20;

        // 2. Surcharge
        const surcharge = cid * 0.50;

        // 3. PAL (10%)
        const pal = cif * 0.10;

        // 4. Excise Duty
        const excise = exciseResult;

        // 5. Luxury Tax (Added to total, excluded from VAT base per 2025 CUSDEC)
        const luxuryTax = calculateLuxuryTax(cif, type);

        // 6. VAT Calculation (18%)
        const vatBase = cif + pal + cid + surcharge + excise;
        const vat = vatBase * 0.18;

        // 7. Fixed Levies
        const vel = 15000;       
        const comFee = 1750;     

        // 8. SSCL
        const sscl = 0; 

        // 9. Totals
        const totalTax = cid + surcharge + excise + luxuryTax + vel + vat + comFee + sscl;
        
        const otherCharges = dealerFee + clearingFee + bankFee;
        const totalCost = cif + totalTax + otherCharges;

        resultData = {
            cifJPY, exchangeRate, cif, type, capacity, age,
            dealerFee, clearingFee, bankFee,
            cid, surcharge, excise,
            luxuryTax, vel, vat, comFee, totalTax, 
            otherCharges, totalCost
        };

        displayResults(resultData);

        const chartsCon = document.getElementById('chartsContainer');
        if (chartsCon) chartsCon.style.display = 'flex';

        loadScript('https://cdn.jsdelivr.net/npm/chart.js').then(() => {
            showCharts(resultData);
        });

        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'flex';

        const resultEl = getElementSafe('result');
        if (resultEl) {
            requestAnimationFrame(() => {
                resultEl.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    // 8. Display Results
    function displayResults(data) {
        const unit = ['electric', 'esmart_petrol', 'esmart_diesel'].includes(resultData.type) ? 'kW' : 'cc';
        const ageText = resultData.age === '1' ? '≤1 year' : '>1–3 years';
        const typeText = resultData.type.replace('_', ' ').toUpperCase();

        const html = `
            <div style="font-weight:700;margin-bottom:0.75rem;color:var(--primary);font-size:1.1rem">
                Inputs Summary
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff">
                    <tr><th style="padding:0.625rem;width:50%;text-align:left">Input Description</th><th style="padding:0.625rem;text-align:right">Value</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">CIF (JPY)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.cifJPY)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Exchange Rate</td><td style="text-align:right;padding:0.5625rem 0.625rem">${resultData.exchangeRate.toFixed(4)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">CIF (LKR)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle Type</td><td style="text-align:right;padding:0.5625rem 0.625rem">${typeText}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Capacity</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.capacity)} ${unit}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Age</td><td style="text-align:right;padding:0.5625rem 0.625rem">${ageText}</td></tr>
                </tbody>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:var(--primary);font-size:1.1rem">
                Tax Breakdown
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff">
                    <tr>
                        <th style="padding:0.625rem;width:45%;text-align:left">Tax Type</th>
                        <th style="padding:0.625rem;text-align:right;width:27.5%">Amount (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Customs Import Duty</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cid)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Surcharge (50% of CID)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.surcharge)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Excise Duty</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.excise)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Luxury Tax</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.luxuryTax)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">VAT (18%)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.vat)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle Entitlement Levy</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.vel)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">COM / Exam / Seal Fee</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.comFee)}</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid var(--primary);background:#f0f4fa">
                    <tr><td style="padding:0.625rem;font-weight:700">Total Taxes & Duties</td><td style="text-align:right;padding:0.625rem;font-weight:700">${formatNumber(data.totalTax)}</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.5rem 0 0.5rem 0;color:var(--primary);font-size:1.1rem">
                Final Cost Summary
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead style="background:var(--primary);color:#fff">
                    <tr>
                        <th style="padding:0.625rem;width:45%;text-align:left">Cost Component</th>
                        <th style="padding:0.625rem;text-align:right;width:27.5%">Amount (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle CIF Value</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Total Taxes & Duties</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.totalTax)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Other Charges (Bank, Dealer & Clearing Fee)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.otherCharges)}</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid var(--primary);background:#e3edfb">
                    <tr><td style="padding:0.625rem;font-weight:700;font-size:1.1rem">TOTAL IMPORT COST</td><td style="text-align:right;padding:0.625rem;font-weight:700;font-size:1.1rem">${formatNumber(data.totalCost)}</td></tr>
                </tfoot>
            </table>
        `;
        const resultEl = getElementSafe('result');
        if (resultEl) resultEl.innerHTML = html;
    }

    // 9. Show Charts
    function showCharts(data) {
        if (!window.Chart) return;
        const ctx1 = getElementSafe('taxPieChart');
        const ctx2 = getElementSafe('pieChart');
        if (!ctx1 || !ctx2) return;

        if (taxChart) taxChart.destroy();
        if (costChart) costChart.destroy();

        taxChart = new Chart(ctx1, {
            type: 'pie',
            data: {
                labels: ['CID', 'Surcharge', 'Excise', 'Luxury Tax', 'VEL', 'VAT'],
                datasets: [{
                    data: [data.cid, data.surcharge, data.excise, data.luxuryTax, data.vel, data.vat],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        costChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: ['CIF Value', 'Total Taxes', 'Other Charges'],
                datasets: [{
                    data: [data.cif, data.totalTax, data.otherCharges],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // 10. PDF Download
    function downloadPDF() {
        if (!resultData) {
            alert('Please calculate the tax first.');
            return;
        }

        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Loading PDF...';
        }

        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
        ]).then(() => {
            setTimeout(() => generatePDFContent(resultData, downloadBtn), 100);
        }).catch(error => {
            console.error('Failed to load PDF libraries', error);
            alert('Failed to load PDF generator. Please try again.');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Save as PDF';
            }
        });
    }

    // 10.1. Generate PDF
    function generatePDFContent(resultData, btn) {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            alert('PDF library not ready. Please try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        let y = 10;

        doc.setFontSize(14);
        doc.text('Sri Lanka Vehicle Tax Calculation 2025', 10, y);
        y += 6;
        doc.setFontSize(10);
        doc.text('Amarasinghe Prime Enterprises (Pvt) Ltd', 10, y);
        y += 5;
        doc.text('Contact: +94 76 944 7740', 10, y);
        y += 5;
        doc.text(`Date: ${new Date().toLocaleString('en-LK')}`, 10, y);
        y += 8;

        // Inputs
        doc.autoTable({
            startY: y,
            head: [['Input Description', 'Value']],
            body: [
                ['CIF (JPY)', formatNumber(resultData.cifJPY)],
                ['Exchange Rate', resultData.exchangeRate.toFixed(4)],
                ['CIF (LKR)', formatNumber(resultData.cif)],
                ['Vehicle Type', resultData.type.replace('_', ' ').toUpperCase()],
                ['Capacity', `${formatNumber(resultData.capacity)}`],
                ['Vehicle Age', resultData.age === '1' ? '≤1 year' : '>1–3 years'],
                ['Dealer Fee (LKR)', formatNumber(resultData.dealerFee)],
                ['Clearing Agent Fee (LKR)', formatNumber(resultData.clearingFee)],
                ['Bank LC Fee (LKR)', formatNumber(resultData.bankFee)]
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 100 } },
            margin: { top: 10, left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 8;

        // TAX TABLE
        doc.text('Tax Breakdown', 10, y - 2);
        doc.autoTable({
            startY: y,
            head: [['Tax Type', 'Amount (LKR)']],
            body: [
                ['Customs Import Duty', formatNumber(resultData.cid)],
                ['Surcharge', formatNumber(resultData.surcharge)],
                ['Excise Duty', formatNumber(resultData.excise)],
                ['Luxury Tax', formatNumber(resultData.luxuryTax)],
                ['VAT', formatNumber(resultData.vat)],
                ['VEL', formatNumber(resultData.vel)],
                ['COM / Exam / Seal Fee', formatNumber(resultData.comFee)]
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            margin: { left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 8;

        // Cost Summary
        doc.autoTable({
            startY: y,
            head: [['Cost Component', 'Amount (LKR)']],
            body: [
                ['Vehicle CIF Value', formatNumber(resultData.cif)],
                ['Total Taxes & Duties', formatNumber(resultData.totalTax)],
                ['Other Charges (Bank, Dealer & Clearing Fee)', formatNumber(resultData.otherCharges)],
                ['TOTAL IMPORT COST', formatNumber(resultData.totalCost)]
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 100 } },
            margin: { left: 10, right: 10 }
        });

        doc.save(`vehicle_tax_${resultData.type}_${Date.now()}.pdf`);
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save as PDF';
        }
    }

    // 11. Reset Form
    function resetForm() {
        const form = getElementSafe('taxCalculatorForm');
        if (form) form.reset();
        resultData = null;
        if (taxChart) { taxChart.destroy(); taxChart = null; }
        if (costChart) { costChart.destroy(); costChart = null; }
        
        const chartsCon = document.getElementById('chartsContainer');
        if (chartsCon) chartsCon.style.display = 'none';

        const resultEl = getElementSafe('result');
        if (resultEl) {
            resultEl.innerHTML = `
                <p class="result-placeholder">Add input data and click the Calculate Tax button to get results</p>
                <p class="result-help">Need help importing your vehicle to Sri Lanka? <a href="https://wa.me/message/XSPMWKK4BGVAM1" target="_blank" rel="noopener">Contact us on WhatsApp</a> for expert assistance!</p>
            `;
        }
        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'none';
        clearErrors();
        updateCapacityLabel();
    }

    // 12. Update Capacity Label
    function updateCapacityLabel() {
        const vehicleTypeEl = getElementSafe('vehicleType');
        const capacityLabelEl = getElementSafe('capacityLabel');
        if (!vehicleTypeEl || !capacityLabelEl) return;
        const vehicleType = vehicleTypeEl.value;
        const isElectric = vehicleType.includes('electric') || vehicleType.includes('esmart');
        capacityLabelEl.textContent = isElectric ? 'Motor Capacity (kW):' : 'Engine Capacity (CC):';
    }

    // 13. Toggle FAQ
    function toggleFAQ(element) {
        const item = element.closest('.faq-item');
        if (!item) return;
        item.classList.toggle('active');
        const indicator = item.querySelector('.faq-indicator');
        if (indicator) indicator.style.transform = item.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    // --- DYNAMIC VEHICLE RENDERER ---
    function renderVehicleShowcase() {
        const slider = document.getElementById('vehicleSlider');
        if (!slider || typeof vehicleInventory === 'undefined') return;

        let html = '';
        
        vehicleInventory.forEach(car => {
            const badgeHtml = car.badge ? `<span class="veh-badge">${car.badge}</span>` : '';
            
            html += `
            <div class="vehicle-card">
                <div class="veh-img-container">
                    <img src="vehicle-photos/${car.image}" alt="${car.model}" loading="lazy">
                    ${badgeHtml}
                </div>
                <div class="veh-info">
                    <h3>${car.model}</h3>
                    
                    <div class="veh-specs-grid">
                        <div class="spec-item" title="Year"><span class="spec-icon">📅</span> ${car.specs.year}</div>
                        <div class="spec-item" title="Mileage"><span class="spec-icon">🛣️</span> ${car.specs.mileage}</div>
                        <div class="spec-item" title="Grade"><span class="spec-icon">✨</span> ${car.specs.grade}</div>
                        <div class="spec-item" title="Auction Grade"><span class="spec-icon">📊</span> Grade ${car.specs.auction}</div>
                    </div>

                    <div class="veh-price-box">
                        <span class="price-sub">Est. Total Cost</span>
                        <span class="price-tag">${car.price}</span>
                    </div>

                    <button class="veh-btn" onclick="fillCalculator(${car.calcCapacity}, ${car.calcCif}, '${car.calcType}')">
                        Calculate Tax →
                    </button>
                </div>
            </div>
            `;
        });

        slider.innerHTML = html;
        initVehicleSlider(); 
    }

    // --- AUTO SLIDER LOGIC ---
    function initVehicleSlider() {
        const slider = document.getElementById('vehicleSlider');
        if (!slider) return;

        let autoSlide;
        const cardWidth = 320; 

        const slideRight = () => {
            if (slider.scrollLeft >= (slider.scrollWidth - slider.clientWidth - 10)) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
            }
        };

        const startSliding = () => { autoSlide = setInterval(slideRight, 3500); };
        const stopSliding = () => { clearInterval(autoSlide); };

        startSliding();

        slider.addEventListener('mouseenter', stopSliding);
        slider.addEventListener('mouseleave', startSliding);
        slider.addEventListener('touchstart', stopSliding);
        slider.addEventListener('touchend', startSliding);

        const leftBtn = document.getElementById('vehLeftBtn');
        const rightBtn = document.getElementById('vehRightBtn');
        
        if(leftBtn) leftBtn.addEventListener('click', () => { stopSliding(); slider.scrollBy({ left: -cardWidth, behavior: 'smooth' }); });
        if(rightBtn) rightBtn.addEventListener('click', () => { stopSliding(); slideRight(); });
    }

    // --- HELPER TO FILL CALCULATOR ---
    window.fillCalculator = function(capacity, cif, type) {
        const capInput = document.getElementById('capacity');
        const cifInput = document.getElementById('cifJPY');
        const typeInput = document.getElementById('vehicleType');
        
        if(capInput) capInput.value = capacity;
        if(cifInput) cifInput.value = cif;
        if(typeInput) typeInput.value = type;

        if(typeInput) typeInput.dispatchEvent(new Event('change'));

        const form = document.getElementById('taxCalculatorForm');
        if(form) form.scrollIntoView({ behavior: 'smooth' });
    };

    // 14. Initialization
    function init() {
        console.log('SL Tax Calculator Loaded');

        startLiveClock();
        updateReviewTimes(); 
        renderVehicleShowcase();

        // --- FETCH RATE FROM "CBSL rates.txt" ---
        const rateEl = getElementSafe('cbslRate');
        if (rateEl) {
            fetch('CBSL%20rates.txt') // <-- Updated to use CBSL file
                .then(r => {
                    if (!r.ok) throw new Error("CBSL rates.txt not found");
                    return r.text();
                })
                .then(text => {
                    const lines = text.trim().split('\n').filter(line => line.trim() !== "");
                    if (lines.length > 0) {
                        const lastLine = lines[lines.length - 1];
                        const parts = lastLine.split(','); 
                        if (parts.length >= 2) {
                            const updatedDate = parts[0].trim();
                            const rate = parseFloat(parts[1].trim());
                            if (!isNaN(rate)) {
                                const exchangeInput = getElementSafe('exchangeRate');
                                if (exchangeInput) exchangeInput.value = rate.toFixed(4);
                                // <-- Updated Display Text -->
                                rateEl.innerHTML = `
                                    <div style="font-weight:700;color:var(--primary)">Exchange Rate: JPY/LKR = ${rate.toFixed(4)}</div>
                                    <div style="color:var(--muted);font-size:0.85rem">Source: Central Bank of Sri Lanka Exchange Rates (Published on: ${updatedDate})</div>
                                `;
                            }
                        }
                    }
                })
                .catch(() => rateEl.innerHTML = 'Failed to fetch exchange rate. Please enter manually.');
        }

        const calculateBtn = getElementSafe('calculateBtn');
        const resetBtn = getElementSafe('resetBtn');
        const downloadBtn = getElementSafe('downloadBtn');
        const vehicleTypeEl = getElementSafe('vehicleType');
        const cifJPYInput = getElementSafe('cifJPY');
        const exchangeRateInput = getElementSafe('exchangeRate');
        const capacityInput = getElementSafe('capacity');
        const ageEl = getElementSafe('age');

        if (calculateBtn) calculateBtn.addEventListener('click', calculateTax);
        if (resetBtn) resetBtn.addEventListener('click', resetForm);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);
        if (vehicleTypeEl) {
            vehicleTypeEl.addEventListener('change', () => {
                updateCapacityLabel();
                clearErrors();
            });
        }
        if (cifJPYInput) cifJPYInput.addEventListener('input', clearErrors);
        if (exchangeRateInput) exchangeRateInput.addEventListener('input', clearErrors);
        if (capacityInput) capacityInput.addEventListener('input', clearErrors);
        if (ageEl) ageEl.addEventListener('change', clearErrors);

        document.querySelectorAll('.faq-item h3').forEach(h3 => {
            h3.addEventListener('click', () => toggleFAQ(h3));
        });
        
        const reviewsContainer = document.getElementById('reviewsContainer');
        const leftArrow = document.querySelector('.left-arrow');
        const rightArrow = document.querySelector('.right-arrow');

        if (reviewsContainer && leftArrow && rightArrow) {
            leftArrow.addEventListener('click', () => {
                reviewsContainer.scrollBy({ left: -300, behavior: 'smooth' });
            });
            
            rightArrow.addEventListener('click', () => {
                reviewsContainer.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }

        console.log('Initialization complete');
    }

    // 15. DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/* =========================================
   JPY/LKR REAL-TIME EXCHANGE RATE CHART
   Fetches data from CBSL rates.txt
   ========================================= */
document.addEventListener("DOMContentLoaded", async function() {
    const chartCanvas = document.getElementById('exchangeRateChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    const tableBody = document.getElementById('rateTableBody');
    
    try {
        // 1. Fetch Data from CBSL rates.txt
        const response = await fetch('CBSL%20rates.txt');
        const dataText = await response.text();
        
        // 2. Process Data
        const rows = dataText.trim().split('\n');
        const labels = [];
        const rates = [];
        
        rows.forEach(row => {
            const cols = row.split(',');
            if(cols.length === 2) {
                const dateObj = new Date(cols[0]);
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const year = dateObj.getFullYear().toString().slice(-2);
                const dateLabel = `${month} ${year}`;
                
                labels.push(dateLabel); 
                rates.push(parseFloat(cols[1]));
            }
        });

        // 3. Update "Big Number" Display
        if (rates.length > 0) {
            const latestRate = rates[rates.length - 1];
            const lastRowCols = rows[rows.length - 1].split(',');
            const lastDateObj = new Date(lastRowCols[0]);
            const fullDateText = lastDateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ", " + lastDateObj.getFullYear();
            
            const rateDisplay = document.getElementById('latestRateDisplay');
            const dateDisplay = document.getElementById('latestDateDisplay');
            
            // Update Label Above Big Number
            const labelSpan = dateDisplay.parentElement.querySelector('span');
            if(labelSpan) labelSpan.textContent = `Effective Market Rate (Week of ${fullDateText})`;

            if (rateDisplay) rateDisplay.textContent = latestRate.toFixed(4);
            if (dateDisplay) dateDisplay.textContent = fullDateText;
        }

        // 4. Generate SEO Table (Last 5 Weeks only)
        if (tableBody) {
            let tableHTML = "";
            const startIdx = Math.max(0, rows.length - 5);
            
            for (let i = rows.length - 1; i >= startIdx; i--) {
                const cols = rows[i].split(',');
                if (cols.length < 2) continue;
                
                const currentRate = parseFloat(cols[1]);
                let changeIcon = "-";
                let changeColor = "#666";
                
                if (i > 0) {
                    const prevCols = rows[i-1].split(',');
                    if (prevCols.length === 2) {
                        const prevRate = parseFloat(prevCols[1]);
                        if (currentRate > prevRate) {
                            changeIcon = "▲ Up"; 
                            changeColor = "#d63384";
                        } else if (currentRate < prevRate) {
                            changeIcon = "▼ Down"; 
                            changeColor = "green";
                        }
                    }
                }

                tableHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px;">${cols[0]}</td>
                        <td style="padding: 8px; font-weight: 600;">${currentRate.toFixed(4)}</td>
                        <td style="padding: 8px; color: ${changeColor}; font-size: 0.85rem;">${changeIcon}</td>
                    </tr>
                `;
            }
            tableBody.innerHTML = tableHTML;
        }

        // 5. Draw Chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'JPY Rate',
                    data: rates,
                    borderColor: '#003087',
                    backgroundColor: 'rgba(0, 48, 135, 0.05)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#003087',
                    pointRadius: 2, 
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            maxTicksLimit: 6, 
                            maxRotation: 0,
                            font: { size: 10 } 
                        } 
                    },
                    y: { 
                        grid: { color: '#f5f5f5' },
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
        
        // Update Bottom Source Text
        const chartContainer = document.querySelector('.rate-chart-container p');
        if(chartContainer) {
            chartContainer.innerHTML = 'Data Source: Central Bank of Sri Lanka Exchange Rates.';
        }

    } catch (error) {
        console.error("Error loading exchange rates:", error);
    }
});
