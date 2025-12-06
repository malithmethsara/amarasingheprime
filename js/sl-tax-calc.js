/*
* Copyright © 2025 Amarasinghe Prime. All Rights Reserved.
*
* This code contains proprietary calculation logic developed by Amarasinghe Prime.
* Unauthorized copying, use, or distribution of this code is strictly prohibited.
*/
(function() {
    'use strict';

    // 1. Global Variables
    let resultData = null;
    let taxChart = null;
    let costChart = null;
    let exchangeChartInstance = null;

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
        const input = getElementSafe(fieldId); if (!input) return;
        const err = document.createElement('div'); err.className = 'error-message'; err.textContent = message;
        const existing = input.parentNode.querySelector('.error-message'); if(existing) existing.remove();
        input.parentNode.insertBefore(err, input.nextSibling); input.focus();
    }
    function clearErrors() { document.querySelectorAll('.error-message').forEach(el => el.remove()); }

    function getElementSafe(id) {
        return document.getElementById(id) || null;
    }

    // --- LIVE CLOCK FUNCTION ---
    function startLiveClock() {
        const timeEl = getElementSafe('timeDateTime');
        if (timeEl) {
            const updateTime = () => {
                timeEl.textContent = new Date().toLocaleString('en-LK', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
            };
            updateTime();
            setInterval(updateTime, 1000);
        }
    }

    // 4.1. Lazy Load External Scripts (PDF)
    function loadExternalScript(url, globalCheck) {
        return new Promise((resolve, reject) => {
            if (window[globalCheck]) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => { resolve(); };
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // 5. Calculate Excise Duty
    function calculateExcise(type, capacity, age) {
        const table = exciseRates[type];
        if (!table) return { error: 'Invalid vehicle type' };
        let minCapacity, maxCapacity, unit;
        if (type.includes('electric') || type.includes('esmart')) { minCapacity = 1; maxCapacity = 600; unit = 'kW'; } 
        else if (type.includes('petrol')) { minCapacity = 600; maxCapacity = 6500; unit = 'cc'; } 
        else if (type.includes('diesel')) { minCapacity = 900; maxCapacity = 6500; unit = 'cc'; } 
        else { return { error: 'Invalid vehicle type' }; }
        
        if (capacity < minCapacity || capacity > maxCapacity) return { error: `! Please enter valid capacity (${minCapacity}–${maxCapacity} ${unit})` };

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

    // 7. Main Calculation
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
        
        // Lazy Load Charts for Pie Charts
        if (window.Chart) {
            showCharts(resultData);
        } else {
            // If Chart.js isn't loaded yet (should be via index.html), try dynamic load
            loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js').then(() => showCharts(resultData));
        }

        const dlBtn = getElementSafe('downloadBtn'); if (dlBtn) dlBtn.style.display = 'flex';
        const resEl = getElementSafe('result'); if (resEl) requestAnimationFrame(() => resEl.scrollIntoView({ behavior: 'smooth' }));
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
                    <tr><th style="padding:0.6rem;text-align:left">Input Description</th><th style="padding:0.6rem;text-align:right">Value</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">CIF (JPY)</td><td style="text-align:right;padding:0.5rem">${formatNumber(resultData.cifJPY)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Exchange Rate</td><td style="text-align:right;padding:0.5rem">${resultData.exchangeRate.toFixed(4)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">CIF (LKR)</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Vehicle Type</td><td style="text-align:right;padding:0.5rem">${typeText}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Capacity</td><td style="text-align:right;padding:0.5rem">${formatNumber(resultData.capacity)} ${unit}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Age</td><td style="text-align:right;padding:0.5rem">${ageText}</td></tr>
                </tbody>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:var(--primary);font-size:1.1rem">
                Tax Breakdown
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:var(--primary);color:#fff">
                    <tr><th style="padding:0.6rem;text-align:left">Tax Type</th><th style="padding:0.6rem;text-align:right">Amount (LKR)</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Customs Import Duty</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.cid)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Surcharge</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.surcharge)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Excise Duty</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.excise)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">Luxury Tax</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.luxuryTax)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">VEL</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.vel)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5rem">VAT</td><td style="text-align:right;padding:0.5rem">${formatNumber(data.vat)}</td></tr>
                </tbody>
                <tfoot style="background:#f0f4fa; font-weight:700;">
                    <tr><td style="padding:0.6rem">Total Taxes</td><td style="text-align:right;padding:0.6rem">${formatNumber(data.totalTax)}</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.5rem 0 0.5rem 0;color:var(--primary);font-size:1.1rem">
                Final Cost Summary
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead style="background:var(--primary);color:#fff">
                    <tr><th style="padding:0.6rem;text-align:left">Cost Component</th><th style="padding:0.6rem;text-align:right">Amount (LKR)</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)">
                        <td style="padding:0.5rem">Vehicle CIF Value</td>
                        <td style="text-align:right;padding:0.5rem">${formatNumber(data.cif)}</td>
                    </tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)">
                        <td style="padding:0.5rem">Total Taxes & Duties</td>
                        <td style="text-align:right;padding:0.5rem">${formatNumber(data.totalTax)}</td>
                    </tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)">
                        <td style="padding:0.5rem">Other Charges (Dealer & Clearing Fee)</td>
                        <td style="text-align:right;padding:0.5rem">${formatNumber(data.otherCharges)}</td>
                    </tr>
                </tbody>
                <tfoot style="background:#e3edfb;border-top:2px solid var(--primary)">
                    <tr>
                        <td style="padding:0.6rem;font-weight:700;font-size:1.1rem">TOTAL IMPORT COST</td>
                        <td style="text-align:right;padding:0.6rem;font-weight:700;font-size:1.1rem">${formatNumber(data.totalCost)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        const resultEl = getElementSafe('result'); if (resultEl) resultEl.innerHTML = html;
    }

    // 9. Show Pie Charts
    function showCharts(data) {
        const ctx1 = getElementSafe('taxPieChart');
        const ctx2 = getElementSafe('pieChart');
        if (!ctx1 || !ctx2 || !window.Chart) return;

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

    // 16. Draw Exchange Rate History Chart (Static Image Used now)
    function drawExchangeRateChart() {
        // Placeholder function if we ever go back to dynamic charts
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

        loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf')
            .then(() => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', 'autoTable')
                            .then(resolve).catch(resolve);
                    }, 100);
                });
            })
            .then(() => generatePDFContent(resultData))
            .catch(error => {
                console.error('Failed to load PDF libraries', error);
                alert('Failed to load PDF generator. Please try again.');
            })
            .finally(() => {
                if (downloadBtn) {
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = 'Save as PDF';
                }
            });
    }

    // 10.1. Generate PDF (Restored with proper formatting)
    function generatePDFContent(resultData) {
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

        // Inputs Summary for PDF
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
                ['Clearing Agent Fee (LKR)', formatNumber(resultData.clearingFee)]
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 100 } },
            margin: { top: 10, left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 8;
        
        // Tax Breakdown for PDF
        doc.autoTable({
            startY: y,
            head: [['Tax Type', 'Amount (LKR)', '% of Total Tax']],
            body: [
                ['Customs Import Duty', formatNumber(resultData.cid), ((resultData.cid/resultData.totalTax)*100).toFixed(1) + '%'],
                ['Surcharge', formatNumber(resultData.surcharge), ((resultData.surcharge/resultData.totalTax)*100).toFixed(1) + '%'],
                ['Excise Duty', formatNumber(resultData.excise), ((resultData.excise/resultData.totalTax)*100).toFixed(1) + '%'],
                ['Luxury Tax', formatNumber(resultData.luxuryTax), ((resultData.luxuryTax/resultData.totalTax)*100).toFixed(1) + '%'],
                ['Vehicle Entitlement Levy', formatNumber(resultData.vel), ((resultData.vel/resultData.totalTax)*100).toFixed(1) + '%'],
                ['VAT (18%)', formatNumber(resultData.vat), ((resultData.vat/resultData.totalTax)*100).toFixed(1) + '%'],
                ['TOTAL TAXES', formatNumber(resultData.totalTax), '100.0%']
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 40 } },
            margin: { left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 8;

        // Final Cost Summary for PDF
        doc.autoTable({
            startY: y,
            head: [['Cost Component', 'Amount (LKR)', '% of Total']],
            body: [
                ['Vehicle CIF Value', formatNumber(resultData.cif), ((resultData.cif/resultData.totalCost)*100).toFixed(1) + '%'],
                ['Total Taxes & Duties', formatNumber(resultData.totalTax), ((resultData.totalTax/resultData.totalCost)*100).toFixed(1) + '%'],
                ['Other Charges (Dealer & Clearing Fee)', formatNumber(resultData.otherCharges), ((resultData.otherCharges/resultData.totalCost)*100).toFixed(1) + '%'],
                ['TOTAL IMPORT COST', formatNumber(resultData.totalCost), '100.0%']
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 } },
            margin: { left: 10, right: 10 }
        });

        doc.save(`vehicle_tax_${resultData.type}_${Date.now()}.pdf`);
    }

    // 11. Reset Form
    function resetForm() {
        const form = getElementSafe('taxCalculatorForm');
        if (form) form.reset();
        resultData = null;
        if (taxChart) { taxChart.destroy(); taxChart = null; }
        if (costChart) { costChart.destroy(); costChart = null; }
        if (exchangeChartInstance) { exchangeChartInstance.destroy(); exchangeChartInstance = null; }
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

    // 14. Initialization
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
    function init() {
        console.log('SL Tax Calculator Loaded');

        startLiveClock(); // Start live clock immediately
        updateReviewTimes();
        
        // Fetch Rate from rates.txt
        const rateEl = getElementSafe('cbslRate');
        if (rateEl) {
            fetch('rates.txt')
                .then(r => {
                    if (!r.ok) throw new Error("rates.txt not found");
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
                                rateEl.innerHTML = `
                                    <div style="font-weight:700;color:var(--primary)">Exchange Rate: JPY/LKR = ${rate.toFixed(4)}</div>
                                    <div style="color:var(--muted);font-size:0.85rem">Source: Sri Lanka Customs Weekly Exchange Rates (Effective from: ${updatedDate})</div>
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

        // Add Review Time Update Logic
        updateReviewTimes();

        console.log('Initialization complete');
    }

    // 15. DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
