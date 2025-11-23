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

    // 2. EXCISE DUTY TABLES — VERIFIED WITH 2025 GAZETTE
    const exciseRates = {
        petrol: [
            // Verified: Min tax for <1000cc is 1,992,000 (Matches Customs XID)
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

    // 4.1. Lazy Load External Scripts (PDF & Charts)
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
            script.onload = () => {
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // 5. Calculate Excise Duty
    function calculateExcise(type, capacity, age) {
        const table = exciseRates[type];
        if (!table) return { error: 'Invalid vehicle type' };

        let minCapacity, maxCapacity, unit;
        if (type.includes('electric') || type.includes('esmart')) {
            minCapacity = 1; maxCapacity = 600; unit = 'kW';
        } else if (type.includes('petrol')) {
            minCapacity = 600; maxCapacity = 6500; unit = 'cc';
        } else if (type.includes('diesel')) {
            minCapacity = 900; maxCapacity = 6500; unit = 'cc';
        } else {
            return { error: 'Invalid vehicle type' };
        }

        if (capacity < minCapacity || capacity > maxCapacity) {
            return { error: `! Please enter valid capacity (${minCapacity}–${maxCapacity} ${unit})` };
        }

        for (let tier of table) {
            const tierMin = tier.min || minCapacity;
            const tierMax = tier.max || maxCapacity;
            if (capacity >= tierMin && capacity <= tierMax) {
                const rateFn = tier.rate;

                // CASE 1: Petrol 601–1000 -> Handled by rate function (min 1,992,000)
                if (type === 'petrol' && capacity <= 1000 && tier.min === 600) {
                    return typeof rateFn === 'function' ? rateFn(capacity) : rateFn * capacity;
                }

                // CASE 2: Hybrid / Plug-in 601–1000
                if (['petrol_hybrid', 'petrol_plugin'].includes(type) && capacity <= 1000 && tier.min === 600) {
                    return 1810900;
                }

                // CASE 3: Electric / eSmart
                if (type.includes('electric') || type.includes('esmart')) {
                    const rate = typeof rateFn === 'function' ? rateFn(age) : rateFn;
                    return rate * capacity;
                }

                // CASE 4: Normal per-cc tiers
                const rate = typeof rateFn === 'function' ? rateFn() : rateFn;
                return rate * capacity;
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
        const elements = {
            cifJPY: getElementSafe('cifJPY'),
            exchangeRate: getElementSafe('exchangeRate'),
            vehicleType: getElementSafe('vehicleType'),
            capacity: getElementSafe('capacity'),
            age: getElementSafe('age'),
            dealerFee: getElementSafe('dealerFee'),
            clearingFee: getElementSafe('clearingFee')
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

        if (cifJPY < 800000 || cifJPY > 20000000) return showError('cifJPY', '! Please enter valid CIF (JPY) amount');
        if (exchangeRate < 1.6 || exchangeRate > 2.9) return showError('exchangeRate', '! Please enter valid Exchange Rate');
        if (!type) return showError('vehicleType', '! Please select vehicle type');
        if (capacity <= 0) return showError('capacity', '! Please enter valid capacity');
        if (!age) return showError('age', '! Please select vehicle age');

        const cif = cifJPY * exchangeRate;
        const exciseResult = calculateExcise(type, capacity, age);
        if (exciseResult.error) return showError('capacity', exciseResult.error);

        // --- CUSTOMS LOGIC (Verified with 2025 CusDec) ---
        const cid = cif * 0.20;          // Customs Import Duty (20%)
        const surcharge = cid * 0.50;    // Surcharge (50% of CID)
        const excise = exciseResult;     // Excise Duty (XID)
        const luxuryTax = calculateLuxuryTax(cif, type);
        const vel = 15000;               // Vehicle Entitlement Levy

        // --- THE CRITICAL FIX: VEL is EXEMPT from VAT ---
        // VAT Base = (CIF * 1.1) + CID + Surcharge + Excise + Luxury Tax
        // NOTE: VEL is intentionally EXCLUDED from this base.
        const vatBase = (cif * 1.1) + cid + surcharge + excise + luxuryTax;
        
        const vat = vatBase * 0.18;      // VAT (18%)

        const totalTax = cid + surcharge + excise + luxuryTax + vel + vat;
        const otherCharges = dealerFee + clearingFee;
        const totalCost = cif + totalTax + otherCharges;

        resultData = {
            cifJPY, exchangeRate, cif, type, capacity, age,
            dealerFee, clearingFee, cid, surcharge, excise,
            luxuryTax, vel, vat, totalTax, otherCharges, totalCost
        };

        displayResults({ cif, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges, totalCost });

        loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', 'Chart')
            .then(() => showCharts({ cif, totalTax, otherCharges, cid, surcharge, excise, luxuryTax, vel, vat }))
            .catch(error => console.error('Failed to load Chart.js', error));

        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'flex';

        const resultEl = getElementSafe('result');
        
        // FIX: Use requestAnimationFrame to prevent "Forced Reflow" warning
        // This politely waits for the next frame before scrolling
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
                    <tr><th style="padding:0.625rem;width:50%;text-align:left">Item</th><th style="padding:0.625rem;text-align:right">Value</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">CIF (JPY)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.cifJPY)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Exchange Rate</td><td style="text-align:right;padding:0.5625rem 0.625rem">${resultData.exchangeRate.toFixed(4)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">CIF (LKR)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle Type</td><td style="text-align:right;padding:0.5625rem 0.625rem">${typeText}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Capacity</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.capacity)} ${unit}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Age</td><td style="text-align:right;padding:0.5625rem 0.625rem">${ageText}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Dealer Fee (LKR)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.dealerFee)}</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Clearing Agent Fee (LKR)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(resultData.clearingFee)}</td></tr>
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
                        <th style="padding:0.625rem;text-align:right;width:27.5%">% of Total Tax</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Customs Import Duty</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cid)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.cid/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Surcharge (50% of CID)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.surcharge)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.surcharge/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Excise Duty</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.excise)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.excise/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Luxury Tax</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.luxuryTax)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.luxuryTax/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle Entitlement Levy</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.vel)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.vel/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">VAT (18%)</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.vat)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.vat/data.totalTax)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid var(--primary);background:#f0f4fa">
                    <tr><td style="padding:0.625rem;font-weight:700">Total Taxes & Duties</td><td style="text-align:right;padding:0.625rem;font-weight:700">${formatNumber(data.totalTax)}</td><td style="text-align:right;padding:0.625rem;font-weight:700">100.0%</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:var(--primary);font-size:1.1rem">
                Final Cost Summary
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead style="background:var(--primary);color:#fff">
                    <tr>
                        <th style="padding:0.625rem;width:45%;text-align:left">Item</th>
                        <th style="padding:0.625rem;text-align:right;width:27.5%">Amount (LKR)</th>
                        <th style="padding:0.625rem;text-align:right;width:27.5%">% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Vehicle CIF Value</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.cif)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.cif/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Total Taxes & Duties</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.totalTax)}</td><td style="text-align:right;padding:0.625rem;font-weight:700">${((data.totalTax/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Other Charges</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.otherCharges)}</td><td style="text-align:right;padding:0.625rem;font-weight:700">${((data.otherCharges/data.totalCost)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid var(--primary);background:#e3edfb">
                    <tr><td style="padding:0.625rem;font-weight:700;font-size:1.1rem">TOTAL IMPORT COST</td><td style="text-align:right;padding:0.625rem;font-weight:700;font-size:1.1rem">${formatNumber(data.totalCost)}</td><td style="text-align:right;padding:0.625rem;font-weight:700">100.0%</td></tr>
                </tfoot>
            </table>
        `;
        const resultEl = getElementSafe('result');
        if (resultEl) resultEl.innerHTML = html;
    }

    // 9. Show Charts
    function showCharts(data) {
        const taxCanvas = getElementSafe('taxPieChart');
        const costCanvas = getElementSafe('pieChart');
        if (!taxCanvas || !costCanvas || !window.Chart) return;

        const ctx1 = taxCanvas.getContext('2d');
        const ctx2 = costCanvas.getContext('2d');

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

    // 10.1. Generate PDF
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

        doc.autoTable({
            startY: y,
            head: [['Input', 'Value']],
            body: [
                ['CIF (JPY)', formatNumber(resultData.cifJPY)],
                ['Exchange Rate', resultData.exchangeRate.toFixed(4)],
                ['CIF (LKR)', formatNumber(resultData.cif)],
                ['Vehicle Type', resultData.type.replace('_', ' ').toUpperCase()],
                ['Capacity', `${formatNumber(resultData.capacity)} ${['electric','esmart_petrol','esmart_diesel'].includes(resultData.type) ? 'kW' : 'cc'}`],
                ['Vehicle Age', resultData.age === '1' ? '≤1 year' : '>1–3 years'],
                ['Dealer Fee (LKR)', formatNumber(resultData.dealerFee)],
                ['Clearing Agent Fee (LKR)', formatNumber(resultData.clearingFee)]
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
            margin: { top: 10, left: 10, right: 10 }
        });

        y = doc.lastAutoTable.finalY + 8;
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
        doc.autoTable({
            startY: y,
            head: [['Summary', 'Amount (LKR)', '% of Total Cost']],
            body: [
                ['CIF Value', formatNumber(resultData.cif), ((resultData.cif/resultData.totalCost)*100).toFixed(1) + '%'],
                ['Total Taxes & Duties', formatNumber(resultData.totalTax), ((resultData.totalTax/resultData.totalCost)*100).toFixed(1) + '%'],
                ['Other Charges', formatNumber(resultData.otherCharges), ((resultData.otherCharges/resultData.totalCost)*100).toFixed(1) + '%'],
                ['TOTAL IMPORT COST', formatNumber(resultData.totalCost), '100.0%']
            ],
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.2 },
            headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 40 } },
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
    function init() {
        console.log('SL Tax Calculator Loaded');

        const timeEl = getElementSafe('timeDateTime');
        if (timeEl) timeEl.textContent = new Date().toLocaleString('en-LK');

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

        console.log('Initialization complete');
    }

    // 15. DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
