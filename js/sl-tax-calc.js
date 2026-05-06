/*
* Copyright © 2026 Amarasinghe Prime. All Rights Reserved.
* Official Calculation Logic - Adjusted for 2026 Gazette & Real World CUSDEC
* Updated: Merged CID(30%), Removed PAL, Added SSL(2.5%), Fixed VAT Base
*/
(function() {
    'use strict';

    // 1. Global Variables
    let resultData = null;
    let taxChart = null;
    let costChart = null;

    // 2. EXCISE DUTY TABLES — VERIFIED WITH 2025/2026 GAZETTE
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
                // Mild Hybrid Logic: If WagonR style (<1000cc), use standard petrol logic per Customs behavior
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

        // Core Values
        const cif = cifJPY * exchangeRate;
        const exciseResult = calculateExcise(type, capacity, age);
        if (exciseResult.error) return showError('capacity', exciseResult.error);

        // 1. Customs Import Duty (CID) - Flat 30%
        const cid = cif * 0.30;

        // 2. Excise Duty
        const excise = exciseResult;

        // 3. Luxury Tax
        const luxuryTax = calculateLuxuryTax(cif, type);

        // 4. Tax Base Calculation (CIF + 10% PAL Uplift + CID + XID)
        const palUplift = cif * 0.10;
        const taxBase = cif + palUplift + cid + excise;

        // 5. SSL (Social Security Levy - 2.5%)
        const sscl = taxBase * 0.025;

        // 6. VAT (18%) - Calculated on the exact same base as SSL
        const vat = taxBase * 0.18;

        // 7. Fixed Levies
        const vel = 15000;       
        const comFee = 1750;     

        // 8. Totals
        const totalTax = cid + excise + sscl + vat + vel + luxuryTax + comFee;
        const otherCharges = dealerFee + clearingFee + bankFee;
        const totalCost = cif + totalTax + otherCharges;

        resultData = {
            cifJPY, exchangeRate, cif, type, capacity, age,
            dealerFee, clearingFee, bankFee,
            cid, excise, sscl,
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
                Tax Breakdown (CUSDEC Format)
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff">
                    <tr>
                        <th style="padding:0.625rem;width:45%;text-align:left">Tax Type</th>
                        <th style="padding:0.625rem;text-align:right;width:27.5%">Amount (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Customs Duty (CID - 30%)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cid)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Excise Duty (XID)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.excise)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Social Security Levy (SSL - 2.5%)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.sscl)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">VAT (18%)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.vat)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Luxury Tax</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.luxuryTax)}</td></tr>
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
                labels: ['CID (30%)', 'Excise', 'SSCL (2.5%)', 'Luxury Tax', 'VEL', 'VAT'],
                datasets: [{
                    data: [data.cid, data.excise, data.sscl, data.luxuryTax, data.vel, data.vat],
                    backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40']
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
        doc.text('Sri Lanka Vehicle Tax Calculation 2026', 10, y);
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
        doc.text('Tax Breakdown (CUSDEC Format)', 10, y - 2);
        doc.autoTable({
            startY: y,
            head: [['Tax Type', 'Amount (LKR)']],
            body: [
                ['Customs Duty (CID - 30%)', formatNumber(resultData.cid)],
                ['Excise Duty (XID)', formatNumber(resultData.excise)],
                ['Social Security Levy (SSL - 2.5%)', formatNumber(resultData.sscl)],
                ['VAT (18%)', formatNumber(resultData.vat)],
                ['Luxury Tax', formatNumber(resultData.luxuryTax)],
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

                    <a href="https://wa.me/94769447740?text=Hi! I would like to get a quotation for the ${encodeURIComponent(car.model)}." target="_blank" rel="noopener" style="text-decoration: none;">
                        <button class="veh-btn">
                            Get Quotation <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" style="vertical-align: middle; margin-left: 5px;"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-26.5l-6.7-4.2-69.8 18.3 18.6-68.1-4.4-6.9c-18.3-29.1-28-63.1-28-97.6 0-101.9 82.9-184.8 184.8-184.8 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                        </button>
                    </a>
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

    // 14. Initialization
    function init() {
        console.log('SL Tax Calculator Loaded');

        startLiveClock();
        updateReviewTimes(); 
        renderVehicleShowcase();

        // --- FETCH DAILY RATE FOR CALCULATOR (Now uses automated CSV file) ---
        const rateEl = getElementSafe('cbslRate');
        if (rateEl) {
            fetch('Data/Rates/CBSL/CBSL-rates.csv') 
                .then(r => {
                    if (!r.ok) throw new Error("CBSL-rates.csv not found");
                    return r.text();
                })
                .then(text => {
                    const lines = text.trim().split('\n').filter(line => line.trim() !== "");
                    if (lines.length > 1) { // Ensure there is data beyond the CSV header
                        const lastLine = lines[lines.length - 1];
                        const parts = lastLine.split(','); 
                        if (parts.length >= 2 && parts[0].trim().toLowerCase() !== 'date') {
                            const updatedDate = parts[0].trim();
                            const rate = parseFloat(parts[1].trim());
                            if (!isNaN(rate)) {
                                const exchangeInput = getElementSafe('exchangeRate');
                                if (exchangeInput) exchangeInput.value = rate.toFixed(4);
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
   DUAL EXCHANGE RATE CHART LOGIC (Fixed)
   ========================================= */
document.addEventListener("DOMContentLoaded", async function() {
    const chartCanvas = document.getElementById('exchangeRateChart');
    if (!chartCanvas) return;

    const ctx = chartCanvas.getContext('2d');
    const tableBody = document.getElementById('rateTableBody');
    
    try {
        const [slcRes, cbslRes] = await Promise.all([
            fetch('Data/Rates/SLC-rates.txt'),
            fetch('Data/Rates/CBSL/CBSL-rates.csv')
        ]);
        
        const slcText = await slcRes.text();
        const cbslText = await cbslRes.text();
        
        // Improved Parsing: Filter out empty lines and lines without a proper comma
        const slcRows = slcText.trim().split('\n').filter(r => r.includes(',') && r.split(',')[0].trim().length > 0);
        const cbslRows = cbslText.trim().split('\n').filter(r => r.includes(',') && r.split(',')[0].trim().length > 0);
        
        let allDates = new Set();
        let slcMap = {};
        let cbslMap = {};
        
        slcRows.forEach(row => {
            const cols = row.split(',');
            const dateStr = cols[0].trim();
            allDates.add(dateStr);
            slcMap[dateStr] = parseFloat(cols[1]);
        });
        
        cbslRows.forEach(row => {
            const cols = row.split(',');
            const dateStr = cols[0].trim();
            if (dateStr.toLowerCase() === 'date') return; // Skip CSV Header row
            allDates.add(dateStr);
            cbslMap[dateStr] = parseFloat(cols[1]);
        });

        // Update "Big Number" Displays
        if (slcRows.length > 0) {
            const lastSlcRow = slcRows[slcRows.length - 1].split(',');
            const slcDateObj = new Date(lastSlcRow[0]);
            const slcDateText = slcDateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ", " + slcDateObj.getFullYear();
            const slcRateEl = document.getElementById('current-slc-rate');
            const slcDateLabel = document.getElementById('slc-date-label');
            if (slcRateEl) slcRateEl.textContent = parseFloat(lastSlcRow[1]).toFixed(4) + " LKR";
            if (slcDateLabel) slcDateLabel.textContent = `Effective Customs Rate (Week of ${slcDateText})`;
        }

        if (cbslRows.length > 0) {
            const lastCbslRow = cbslRows[cbslRows.length - 1].split(',');
            const cbslDateObj = new Date(lastCbslRow[0]);
            const cbslDateText = cbslDateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ", " + cbslDateObj.getFullYear();
            const cbslRateEl = document.getElementById('current-cbsl-rate');
            const cbslDateLabel = document.getElementById('cbsl-date-label');
            if (cbslRateEl) cbslRateEl.textContent = parseFloat(lastCbslRow[1]).toFixed(4) + " LKR";
            if (cbslDateLabel) cbslDateLabel.textContent = `Central Bank Daily Exchange Rate (As of ${cbslDateText})`;
        }
        
        const sortedDates = Array.from(allDates).sort();
        const labels = [];
        const slcData = [];
        const cbslData = [];
        
        sortedDates.forEach(dateStr => {
            const d = new Date(dateStr);
            // Skip invalid dates to prevent "Invalid Date" labels
            if (isNaN(d.getTime())) return;

            labels.push(`${d.toLocaleDateString('en-US', {month:'short'})} ${d.getFullYear().toString().slice(-2)}`);
            slcData.push(slcMap[dateStr] !== undefined ? slcMap[dateStr] : null);
            cbslData.push(cbslMap[dateStr] !== undefined ? cbslMap[dateStr] : null);
        });

        // Generate Table
        if (tableBody) {
            let tableHTML = "";
            const startIdx = Math.max(0, slcRows.length - 5);
            for (let i = slcRows.length - 1; i >= startIdx; i--) {
                const cols = slcRows[i].split(',');
                const currentRate = parseFloat(cols[1]);
                let changeIcon = "-";
                let changeColor = "#666";
                if (i > 0) {
                    const prevRate = parseFloat(slcRows[i-1].split(',')[1]);
                    if (currentRate > prevRate) { changeIcon = "▲ Up"; changeColor = "#d63384"; }
                    else if (currentRate < prevRate) { changeIcon = "▼ Down"; changeColor = "green"; }
                }
                tableHTML += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">${cols[0]}</td><td style="padding: 8px; font-weight: 600;">${currentRate.toFixed(4)}</td><td style="padding: 8px; color: ${changeColor}; font-size: 0.85rem;">${changeIcon}</td></tr>`;
            }
            tableBody.innerHTML = tableHTML;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Customs Rate (Weekly)', data: slcData, borderColor: '#007bff', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, fill: false, spanGaps: true, tension: 0.1 },
                    { label: 'CBSL Rate (Daily)', data: cbslData, borderColor: '#dc3545', borderWidth: 2, borderDash: [], pointRadius: 0, pointHoverRadius: 5, fill: false, spanGaps: true, tension: 0.1 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 15, font: { size: 11 } } } },
                scales: {
                    x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 6, maxRotation: 0, font: { size: 10 } } },
                    y: { grid: { color: '#f5f5f5' }, ticks: { font: { size: 10 } } }
                }
            }
        });
    } catch (error) {
        console.error("Error loading exchange rates:", error);
    }
});

/* =========================================
   MOBILE MENU & DROPDOWN TOGGLE
   ========================================= */
document.addEventListener("DOMContentLoaded", function() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const closeBtn = document.querySelector('.close-sidebar-btn');
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; 
    }

    if(mobileBtn) {
        mobileBtn.addEventListener('click', openSidebar);
    }
    if(closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    if(overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // --- NEW: Mobile Dropdown Toggle ---
    const mobileDropdownBtn = document.querySelector('.mobile-dropdown-btn');
    const mobileDropdownContent = document.getElementById('mobileCalcDropdown');
    
    if (mobileDropdownBtn && mobileDropdownContent) {
        mobileDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mobileDropdownContent.classList.toggle('show');
            
            const chevron = mobileDropdownBtn.querySelector('.chevron');
            if (mobileDropdownContent.classList.contains('show')) {
                chevron.style.transform = 'rotate(180deg)';
            } else {
                chevron.style.transform = 'rotate(0deg)';
            }
        });
    }

    // --- NEW: Close Mobile Sidebar when tapping an anchor link (like Tax Calculator) ---
    document.querySelectorAll('.mobile-dropdown-item[href^="index.html#"]').forEach(anchor => {
        anchor.addEventListener('click', function () {
            closeSidebar();
        });
    });
});

// --- SHIPPING SCHEDULE FETCH LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("scheduleBody");
    
    if (tableBody) {
        const jsonUrl = "/Data/Shipping/shipping_schedule.json";
        const fetchUrl = jsonUrl + '?t=' + new Date().getTime();

        fetch(fetchUrl)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(data => {
                tableBody.innerHTML = ""; 

                if (data.length === 0) {
                    tableBody.innerHTML = "<tr><td colspan='5'>No upcoming vessels found.</td></tr>";
                    return;
                }

                data.forEach(ship => {
                    const tr = document.createElement("tr");

                    // 1. Vessel & Voyage
                    const tdVessel = document.createElement("td");
                    tdVessel.innerHTML = `<strong>${ship.vessel_voyage}</strong><br><span style="font-size:0.8rem; color:#888;">${ship.type}</span>`;
                    tr.appendChild(tdVessel);

                    // 2. Shipping Line
                    const tdLine = document.createElement("td");
                    tdLine.textContent = ship.shipping_line;
                    tr.appendChild(tdLine);

                    // 3. Departure Port (Japan)
                    const tdPort = document.createElement("td");
                    let portHTML = '<div class="departure-stack">';
                    ship.departures.forEach(dep => {
                        portHTML += `<div style="margin-bottom: 4px;">${dep.port}</div>`;
                    });
                    portHTML += '</div>';
                    tdPort.innerHTML = portHTML;
                    tr.appendChild(tdPort);

                    // 4. Departure Date (Japan)
                    const tdDate = document.createElement("td");
                    let dateHTML = '<div class="departure-stack">';
                    ship.departures.forEach(dep => {
                        dateHTML += `<div style="margin-bottom: 4px; font-weight: 600; color: var(--muted);">${dep.date}</div>`;
                    });
                    dateHTML += '</div>';
                    tdDate.innerHTML = dateHTML;
                    tr.appendChild(tdDate);

                    // 5. Arrival (Hambantota)
                    const tdArr = document.createElement("td");
                    tdArr.innerHTML = `
                        <span class="arrival-highlight">${ship.arrival.date}</span><br>
                        <span style="font-size:0.85rem; color:#666;">${ship.arrival.port}</span>`;
                    tr.appendChild(tdArr);

                    tableBody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("Error loading schedule:", error);
                tableBody.innerHTML = "<tr><td colspan='5' style='color:red;'>Could not load schedule data. Please check your connection.</td></tr>";
            });
    }
});
