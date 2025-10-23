/*
* Copyright © 2025 Amarasinghe Prime. All Rights Reserved.
*
* This code contains proprietary calculation logic developed by Amarasinghe Prime.
* Unauthorized copying, use, or distribution of this code is strictly prohibited.
*/
(function() {
    'use strict';

    // 1. Global Variables (Safe Initialization)
    let resultData = null;
    let taxChart = null;
    let costChart = null;

    // 2. Excise Duty Tables (Exact 2025 Gazette Rates - HS Code Based)
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
            { min: 900, max: 1500, rate: 4150 },
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
            { min: 900, max: 1500, rate: 4150 },
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
            { min: 40, max: 50, rate: (age) => age === '1' ? 18100 : 36200 },
            { max: 100, rate: (age) => age === '1' ? 24100 : 36200 },
            { max: 200, rate: (age) => age === '1' ? 36200 : 60400 },
            { max: 600, rate: (age) => age === '1' ? 96600 : 132800 }
        ],
        esmart_petrol: [
            { min: 20, max: 50, rate: (age) => age === '1' ? 30770 : 43440 },
            { max: 100, rate: (age) => age === '1' ? 40970 : 43440 },
            { max: 200, rate: (age) => age === '1' ? 41630 : 63420 },
            { max: 600, rate: (age) => age === '1' ? 111090 : 139440 }
        ],
        esmart_diesel: [
            { min: 20, max: 50, rate: (age) => age === '1' ? 36920 : 52130 },
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
    
    // 4.1. Lazy Load Utility (FIX APPLIED)
    function loadExternalScript(url, globalCheck) {
        return new Promise((resolve, reject) => {
            // Check if the script is already loaded
            if (window[globalCheck]) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                console.log(`✅ Lazy Loaded ${globalCheck}`);
                
                // Special case for jsPDF: also load the autotable plugin after the main library
                if (globalCheck === 'jspdf') {
                    const autotableScript = document.createElement('script');
                    autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
                    autotableScript.defer = true;
                    autotableScript.onload = resolve;
                    autotableScript.onerror = reject;
                    document.head.appendChild(autotableScript);
                } else {
                    resolve();
                }
            };
            script.onerror = () => reject(new Error(`❌ Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    // 5. Calculate Excise Duty (Core Logic)
    function calculateExcise(type, capacity, age) {
        const table = exciseRates[type];
        if (!table) return { error: 'Invalid vehicle type' };

        let minCapacity, maxCapacity, unit;
        if (type === 'esmart_petrol' || type === 'esmart_diesel') {
            minCapacity = 20;
            maxCapacity = 600;
            unit = 'kW';
        } else if (type === 'electric') {
            minCapacity = 40;
            maxCapacity = 600;
            unit = 'kW';
        } else if (type.includes('petrol')) {
            minCapacity = 600;
            maxCapacity = 6500;
            unit = 'cc';
        } else if (type.includes('diesel')) {
            minCapacity = 900;
            maxCapacity = 6500;
            unit = 'cc';
        } else {
            return { error: 'Invalid vehicle type' };
        }

        if (capacity < minCapacity || capacity > maxCapacity) {
            return { error: `! Please enter valid capacity (${minCapacity}-${maxCapacity} ${unit})` };
        }

        for (let tier of table) {
            if (capacity <= (tier.max || maxCapacity)) {
                if (tier.rate) {
                    const rate = typeof tier.rate === 'function' ? tier.rate(age) : tier.rate;
                    if (tier.calc) return tier.calc(capacity, rate);
                    return rate * capacity;
                }
                if (tier.fixed) return tier.fixed;
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

    // 7. Main Calculation Function (FIX APPLIED: Lazy loads Chart.js)
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

        const cid = cif * 0.2;
        const surcharge = cid * 0.5;
        const excise = exciseResult;
        const luxuryTax = calculateLuxuryTax(cif, type);
        const vel = 15000;
        // VAT Base: (CIF * 1.1) + CID + Surcharge + Excise + LuxuryTax + VEL
        const vatBase = (cif * 1.1) + cid + surcharge + excise + luxuryTax + vel;
        const vat = vatBase * 0.18;
        const totalTax = cid + surcharge + excise + luxuryTax + vel + vat;
        const otherCharges = dealerFee + clearingFee;
        const totalCost = cif + totalTax + otherCharges;

        resultData = {
            cifJPY, exchangeRate, cif, type, capacity, age,
            dealerFee, clearingFee, cid, surcharge, excise,
            luxuryTax, vel, vat, totalTax, otherCharges, totalCost
        };

        displayResults({ cif, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges, totalCost });
        
        // Lazy load Chart.js only when results are ready
        loadExternalScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', 'Chart')
            .then(() => {
                showCharts({ cif, totalTax, otherCharges, cid, surcharge, excise, luxuryTax, vel, vat });
            })
            .catch(error => {
                console.error('Failed to load Chart.js', error);
                if (taxChart) taxChart.destroy();
                if (costChart) costChart.destroy();
            });

        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'flex';

        const resultEl = getElementSafe('result');
        if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
    }

    // 8. Display Results Table (UNCHANGED)
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
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Total Taxes & Duties</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.totalTax)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.totalTax/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid rgba(0,48,135,0.15)"><td style="padding:0.5625rem 0.625rem">Other Charges</td><td style="text-align:right;padding:0.5625rem 0.625rem">${formatNumber(data.otherCharges)}</td><td style="text-align:right;padding:0.5625rem 0.625rem">${((data.otherCharges/data.totalCost)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid var(--primary);background:#e3edfb">
                    <tr><td style="padding:0.625rem;font-weight:700;font-size:1.1rem">TOTAL IMPORT COST</td><td style="text-align:right;padding:0.625rem;font-weight:700;font-size:1.1rem">${formatNumber(data.totalCost)}</td><td style="text-align:right;padding:0.625rem;font-weight:700">100.0%</td></tr>
                </tfoot>
            </table>
        `;
        const resultEl = getElementSafe('result');
        if (resultEl) resultEl.innerHTML = html;
    }

    // 9. Show Charts (UNCHANGED)
    function showCharts(data) {
        const taxCanvas = getElementSafe('taxPieChart');
        const costCanvas = getElementSafe('pieChart');
        // This check ensures Chart is available after lazy-loading
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

// ************************************************************
// ** START OF CORRECTED PDF FUNCTIONS **
// ************************************************************

    // 10. PDF Download (FIXED: Handles initialization and download retry)
    function downloadPDF() {
        if (!resultData) {
            alert('Please calculate the tax first.');
            return;
        }

        // 1. Define the correct ready check
        const isPDFReady = typeof window.jspdf !== 'undefined' && 
                           typeof window.jspdf.jsPDF !== 'undefined' &&
                           typeof window.jspdf.jsPDF.prototype.autoTable === 'function';

        if (isPDFReady) {
            // 2. If already loaded, execute immediately and return.
            generatePDFContent(resultData);
            return;
        }

        // 3. If not loaded, handle the async loading process
        const downloadBtn = getElementSafe('downloadBtn');
        if (downloadBtn) downloadBtn.disabled = true;
        if (downloadBtn) downloadBtn.textContent = 'Preparing PDF...';

        // Lazy load jsPDF only when the download button is clicked
        loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf')
            .then(() => {
                // generatePDFContent handles the actual PDF creation (which includes doc.save())
                generatePDFContent(resultData);
            })
            .catch(error => {
                console.error('Failed to load jsPDF', error);
                alert('Failed to load PDF generator. Please try again.');
            })
            .finally(() => {
                // Re-enable button regardless of success or failure
                if (downloadBtn) {
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = 'Save as PDF';
                }
            });
    }

    // 10.1. PDF Content Helper (FIXED: Silent return if library is not fully initialized)
    function generatePDFContent(resultData) {
        // Correct check: Ensure jspdf core and AutoTable plugin are ready. Stop silently if not.
        const isReady = typeof window.jspdf !== 'undefined' && 
                        typeof window.jspdf.jsPDF !== 'undefined' &&
                        typeof window.jspdf.jsPDF.prototype.autoTable === 'function';
        
        if (!isReady) {
            return; // Stops execution without an alert, allowing the async loading in downloadPDF to finish.
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
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
        // Taxes
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
        // Summary
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
    
// ************************************************************
// ** END OF CORRECTED PDF FUNCTIONS **
// ************************************************************

    // 11. Reset Form (UNCHANGED)
    function resetForm() {
        const form = getElementSafe('taxCalculatorForm');
        if (form) form.reset();
        
        resultData = null;
        if (taxChart) {
            taxChart.destroy();
            taxChart = null;
        }
        if (costChart) {
            costChart.destroy();
            costChart = null;
        }
        
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

    // 12. Update Capacity Label (UNCHANGED)
    function updateCapacityLabel() {
        const vehicleTypeEl = getElementSafe('vehicleType');
        const capacityLabelEl = getElementSafe('capacityLabel');
        if (!vehicleTypeEl || !capacityLabelEl) return;
        
        const vehicleType = vehicleTypeEl.value;
        const isElectric = vehicleType.includes('electric') || vehicleType.includes('esmart');
        capacityLabelEl.textContent = isElectric ? 'Motor Capacity (kW):' : 'Engine Capacity (CC):';
    }

    // 13. Toggle FAQ (UNCHANGED)
    function toggleFAQ(element) {
        const item = element.closest('.faq-item');
        if (!item) return;
        item.classList.toggle('active');
        const indicator = item.querySelector('.faq-indicator');
        if (indicator) {
            indicator.style.transform = item.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    // 14. Initialization (UNCHANGED)
    function init() {
        console.log('✅ SL Tax Calculator Loaded');
        
        const timeEl = getElementSafe('timeDateTime');
        if (timeEl) timeEl.textContent = new Date().toLocaleString('en-LK');

        const rateEl = getElementSafe('cbslRate');
        if (rateEl) {
            fetch('/rate.json')
                .then(r => r.json())
                .then(data => {
                    const rate = parseFloat(data.sellingRate);
                    const updatedDate = data.updatedDate;
                    const exchangeInput = getElementSafe('exchangeRate');
                    if (exchangeInput) exchangeInput.value = rate.toFixed(4);
                    rateEl.innerHTML = `
                        <div style="font-weight:700;color:var(--primary)">Exchange Rate: JPY/LKR = ${rate.toFixed(4)}</div>
                        <div style="color:var(--muted);font-size:0.85rem">Source: Central Bank of Sri Lanka (Updated: ${updatedDate})</div>
                    `;
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

        console.log('✅ Initialization complete');
    }

    // 15. DOM Ready (Incognito-Safe) 
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 16. Window Load (Extra Safety) - FIX APPLIED: REMOVED DUPLICATE INITIALIZER
    // window.addEventListener('load', init); 
})();
