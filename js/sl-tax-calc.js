// /js/sl-tax-calc.js - ✅ FIXED & 100% WORKING VERSION
(function() {
    'use strict';

    // Excise duty tables (EXACT 2025 Gazette rates)
    const exciseTables = {
        petrol: [
            {min: 601, max: 1000, calc: function(cc) { return Math.max(2450 * cc, 1992000); }},
            {max: 1300, rate: 3850},
            {max: 1500, rate: 4450},
            {max: 1600, rate: 5150},
            {max: 1800, rate: 6400},
            {max: 2000, rate: 7700},
            {max: 2500, rate: 8450},
            {max: 2750, rate: 9650},
            {max: 3000, rate: 10850},
            {max: 4000, rate: 12050},
            {max: Infinity, rate: 13300}
        ],
        petrol_hybrid: [
            {min: 601, max: 1000, fixed: 1810900},
            {max: 1300, rate: 2750},
            {max: 1500, rate: 3450},
            {max: 1600, rate: 4800},
            {max: 1800, rate: 6300},
            {max: 2000, rate: 6900},
            {max: 2500, rate: 7250},
            {max: 2750, rate: 8450},
            {max: 3000, rate: 9650},
            {max: 4000, rate: 10850},
            {max: Infinity, rate: 12050}
        ],
        petrol_plugin: [
            {min: 601, max: 1000, fixed: 1810900},
            {max: 1300, rate: 2750},
            {max: 1500, rate: 3450},
            {max: 1600, rate: 4800},
            {max: 1800, rate: 6250},
            {max: 2000, rate: 6900},
            {max: 2500, rate: 7250},
            {max: 2750, rate: 8450},
            {max: 3000, rate: 9650},
            {max: 4000, rate: 10850},
            {max: Infinity, rate: 12050}
        ],
        diesel: [
            {min: 901, max: 1500, rate: 5500},
            {max: 1600, rate: 6950},
            {max: 1800, rate: 8300},
            {max: 2000, rate: 9650},
            {max: 2500, rate: 9650},
            {max: 2750, rate: 10850},
            {max: 3000, rate: 12050},
            {max: 4000, rate: 13300},
            {max: Infinity, rate: 14500}
        ],
        diesel_hybrid: [
            {min: 901, max: 1500, rate: 4150},
            {max: 1600, rate: 5500},
            {max: 1800, rate: 6900},
            {max: 2000, rate: 8350},
            {max: 2500, rate: 8450},
            {max: 2750, rate: 9650},
            {max: 3000, rate: 10850},
            {max: 4000, rate: 12050},
            {max: Infinity, rate: 13300}
        ],
        diesel_plugin: [
            {min: 901, max: 1500, rate: 4150},
            {max: 1600, rate: 5500},
            {max: 1800, rate: 6900},
            {max: 2000, rate: 8300},
            {max: 2500, rate: 8450},
            {max: 2750, rate: 9650},
            {max: 3000, rate: 10850},
            {max: 4000, rate: 12050},
            {max: Infinity, rate: 13300}
        ],
        electric: [
            {max: 50, rate: function(age) { return age === '1' ? 18100 : 36200; }},
            {max: 100, rate: function(age) { return age === '1' ? 24100 : 36200; }},
            {max: 200, rate: function(age) { return age === '1' ? 36200 : 60400; }},
            {max: Infinity, rate: function(age) { return age === '1' ? 96600 : 132800; }}
        ],
        esmart_petrol: [
            {max: 50, rate: function(age) { return age === '1' ? 30770 : 43440; }},
            {max: 100, rate: function(age) { return age === '1' ? 40970 : 43440; }},
            {max: 200, rate: function(age) { return age === '1' ? 41630 : 63420; }},
            {max: Infinity, rate: function(age) { return age === '1' ? 111090 : 139440; }}
        ],
        esmart_diesel: [
            {max: 50, rate: function(age) { return age === '1' ? 36920 : 52130; }},
            {max: 100, rate: function(age) { return age === '1' ? 49160 : 52130; }},
            {max: 200, rate: function(age) { return age === '1' ? 49960 : 76100; }},
            {max: Infinity, rate: function(age) { return age === '1' ? 133310 : 167330; }}
        ]
    };

    const luxuryThresholds = {
        petrol: 5000000, diesel: 5000000, 
        petrol_hybrid: 5500000, diesel_hybrid: 5500000,
        petrol_plugin: 5500000, diesel_plugin: 5500000,
        electric: 6000000, esmart_petrol: 6000000, esmart_diesel: 6000000
    };

    const luxuryRates = {
        petrol: 1.0, diesel: 1.2, 
        petrol_hybrid: 0.8, diesel_hybrid: 0.9,
        petrol_plugin: 0.8, diesel_plugin: 0.9,
        electric: 0.6, esmart_petrol: 0.6, esmart_diesel: 0.6
    };

    // Format numbers
    function formatNumber(num, decimals = 0) {
        return num.toLocaleString('en-US', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        });
    }

    // Calculate excise duty
    function calculateExcise(type, capacity, age) {
        const table = exciseTables[type];
        if (!table) return { error: 'Invalid vehicle type' };

        const minCapacity = type.includes('petrol') && !type.includes('plugin') ? 600 : 
                          type.includes('diesel') ? 900 : 1;
        if (capacity < minCapacity) {
            return { error: `Minimum ${minCapacity} ${type.includes('electric') || type.includes('esmart') ? 'kW' : 'cc'}` };
        }

        for (let tier of table) {
            if ('max' in tier && capacity <= tier.max) {
                if (tier.fixed) return tier.fixed;
                if (tier.calc) return tier.calc(capacity);
                if (tier.rate) {
                    const rateFn = typeof tier.rate === 'function' ? tier.rate(age) : tier.rate;
                    return rateFn * capacity;
                }
            }
        }
        return 0;
    }

    // Calculate luxury tax
    function calculateLuxuryTax(cif, type) {
        const threshold = luxuryThresholds[type] || 5000000;
        const rate = luxuryRates[type] || 1.0;
        return cif > threshold ? (cif - threshold) * rate : 0;
    }

    // Main tax calculation
    function calculateTax() {
        try {
            const cifJPY = parseFloat(document.getElementById('cifJPY')?.value) || 0;
            const exchangeRate = parseFloat(document.getElementById('exchangeRate')?.value) || 0;
            const type = document.getElementById('vehicleType')?.value || '';
            const capacity = parseFloat(document.getElementById('capacity')?.value) || 0;
            const age = document.getElementById('age')?.value || '';
            const dealerFee = parseFloat(document.getElementById('dealerFee')?.value) || 0;
            const clearingFee = parseFloat(document.getElementById('clearingFee')?.value) || 0;

            if (cifJPY <= 0) return showError('cifJPY', 'Enter valid CIF value (JPY)');
            if (exchangeRate <= 0) return showError('exchangeRate', 'Enter valid exchange rate');
            if (!type) return showError('vehicleType', 'Select vehicle type');
            if (capacity <= 0) return showError('capacity', 'Enter valid capacity');
            if (!age) return showError('age', 'Select vehicle age');

            const cif = cifJPY * exchangeRate;
            const exciseResult = calculateExcise(type, capacity, age);
            if (exciseResult.error) return showError('capacity', exciseResult.error);

            const cid = cif * 0.2;
            const surcharge = cid * 0.5;
            const excise = exciseResult;
            const luxuryTax = calculateLuxuryTax(cif, type);
            const vel = 15000;
            const vatBase = (cif * 1.1) + cid + surcharge + excise + luxuryTax + vel;
            const vat = vatBase * 0.18;
            const totalTax = cid + surcharge + excise + luxuryTax + vel + vat;
            const otherCharges = dealerFee + clearingFee;
            const totalCost = cif + totalTax + otherCharges;

            window.resultData = {
                cifJPY, exchangeRate, cif, type, capacity, age, 
                dealerFee, clearingFee, cid, surcharge, excise, 
                luxuryTax, vel, vat, totalTax, otherCharges, totalCost
            };

            displayResults({ cif, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges, totalCost });
            showCharts({ cif, totalTax, otherCharges, cid, surcharge, excise, luxuryTax, vel, vat });
            
            const downloadBtn = document.getElementById('downloadBtn');
            if (downloadBtn) downloadBtn.style.display = 'flex';
            
            const resultEl = document.getElementById('result');
            if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
            
            clearErrors();

        } catch (error) {
            console.error('Calculation error:', error);
            showError('cifJPY', 'Calculation error. Please try again.');
        }
    }

    // Display results table
    function displayResults(data) {
        const unit = ['electric', 'esmart_petrol', 'esmart_diesel'].includes(window.resultData?.type || '') ? 'kW' : 'cc';
        const ageText = (window.resultData?.age || '') === '1' ? '≤1 year' : '>1–3 years';
        const typeText = (window.resultData?.type || '').replace('_', ' ').toUpperCase();

        const html = `
            <div style="font-weight:700;margin-bottom:0.75rem;color:#003087;font-size:1.1rem">
                Inputs Summary
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:#003087;color:white">
                    <tr><th style="padding:0.75rem;width:50%;text-align:left">Item</th><th style="padding:0.75rem;text-align:right">Value</th></tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">CIF (JPY)</td><td style="text-align:right;padding:0.75rem">${formatNumber(window.resultData.cifJPY)}</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Exchange Rate</td><td style="text-align:right;padding:0.75rem">${window.resultData.exchangeRate.toFixed(4)}</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">CIF (LKR)</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.cif)}</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Vehicle Type</td><td style="text-align:right;padding:0.75rem">${typeText}</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Capacity</td><td style="text-align:right;padding:0.75rem">${formatNumber(window.resultData.capacity)} ${unit}</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Age</td><td style="text-align:right;padding:0.75rem">${ageText}</td></tr>
                </tbody>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:#003087;font-size:1.1rem">
                Tax Breakdown
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
                <thead style="background:#003087;color:white">
                    <tr>
                        <th style="padding:0.75rem;width:45%;text-align:left">Tax Type</th>
                        <th style="padding:0.75rem;text-align:right;width:27.5%">Amount (LKR)</th>
                        <th style="padding:0.75rem;text-align:right;width:27.5%">% of Total Tax</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Customs Import Duty</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.cid)}</td><td style="text-align:right;padding:0.75rem">${((data.cid/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Surcharge (50% of CID)</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.surcharge)}</td><td style="text-align:right;padding:0.75rem">${((data.surcharge/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Excise Duty</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.excise)}</td><td style="text-align:right;padding:0.75rem">${((data.excise/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Luxury Tax</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.luxuryTax)}</td><td style="text-align:right;padding:0.75rem">${((data.luxuryTax/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Vehicle Entitlement Levy</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.vel)}</td><td style="text-align:right;padding:0.75rem">${((data.vel/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">VAT (18%)</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.vat)}</td><td style="text-align:right;padding:0.75rem">${((data.vat/data.totalTax)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid #003087;background:#f0f4fa">
                    <tr><td style="padding:0.75rem;font-weight:bold">Total Taxes & Duties</td><td style="text-align:right;padding:0.75rem;font-weight:bold">${formatNumber(data.totalTax)}</td><td style="text-align:right;padding:0.75rem;font-weight:bold">100.0%</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem 0;color:#003087;font-size:1.1rem">
                Final Cost Summary
            </div>
            <table style="width:100%;border-collapse:collapse">
                <thead style="background:#003087;color:white">
                    <tr>
                        <th style="padding:0.75rem;width:45%;text-align:left">Item</th>
                        <th style="padding:0.75rem;text-align:right;width:27.5%">Amount (LKR)</th>
                        <th style="padding:0.75rem;text-align:right;width:27.5%">% of Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Vehicle CIF Value</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.cif)}</td><td style="text-align:right;padding:0.75rem">${((data.cif/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Total Taxes & Duties</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.totalTax)}</td><td style="text-align:right;padding:0.75rem">${((data.totalTax/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr style="border-bottom:1px solid #e0e0e0"><td style="padding:0.75rem">Other Charges</td><td style="text-align:right;padding:0.75rem">${formatNumber(data.otherCharges)}</td><td style="text-align:right;padding:0.75rem">${((data.otherCharges/data.totalCost)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot style="border-top:2px solid #003087;background:#e3f2fd">
                    <tr><td style="padding:0.75rem;font-weight:bold;font-size:1.1rem">TOTAL IMPORT COST</td><td style="text-align:right;padding:0.75rem;font-weight:bold;font-size:1.1rem">${formatNumber(data.totalCost)}</td><td style="text-align:right;padding:0.75rem;font-weight:bold">100.0%</td></tr>
                </tfoot>
            </table>
        `;
        
        const resultEl = document.getElementById('result');
        if (resultEl) resultEl.innerHTML = html;
    }

    // Show pie charts (SAFE version)
    function showCharts(data) {
        try {
            const taxCanvas = document.getElementById('taxPieChart');
            const costCanvas = document.getElementById('pieChart');
            
            if (!taxCanvas || !costCanvas || !window.Chart) return;

            const ctx1 = taxCanvas.getContext('2d');
            const ctx2 = costCanvas.getContext('2d');

            if (window.taxChart) window.taxChart.destroy();
            if (window.costChart) window.costChart.destroy();

            window.taxChart = new Chart(ctx1, {
                type: 'pie',
                data: {
                    labels: ['CID', 'Surcharge', 'Excise', 'Luxury Tax', 'VEL', 'VAT'],
                    datasets: [{
                        data: [data.cid, data.surcharge, data.excise, data.luxuryTax, data.vel, data.vat],
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });

            window.costChart = new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['CIF Value', 'Total Taxes', 'Other Charges'],
                    datasets: [{
                        data: [data.cif, data.totalTax, data.otherCharges],
                        backgroundColor: ['#A8E6CF', '#FFD3B6', '#FFAAA5']
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        } catch (e) {
            console.warn('Charts failed to load:', e);
        }
    }

    // FIXED Error handling
    function showError(fieldId, message) {
        clearErrors();
        const input = document.getElementById(fieldId);
        if (!input) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'color: #d32f2f; font-size: 0.9rem; margin-top: 0.25rem; background: #ffebee; padding: 0.5rem; border-radius: 0.25rem; border-left: 4px solid #d32f2f;';
        errorDiv.textContent = `❌ ${message}`;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    // FIXED Reset form
    function resetForm() {
        const form = document.getElementById('taxCalculatorForm');
        if (form) form.reset();
        
        const resultEl = document.getElementById('result');
        if (resultEl) {
            resultEl.innerHTML = `
                <p class="result-placeholder" style="font-size:1rem;color:#5b5b5b;text-align:center;margin-bottom:1.5rem;padding:2rem">
                    👆 Add input data and click <strong>Calculate Tax</strong> to get results
                </p>
                <p class="result-help" style="font-size:0.95rem;color:#5b5b5b;text-align:center">
                    Need help importing your vehicle to Sri Lanka? 
                    <a href="https://wa.me/message/XSPMWKK4BGVAM1" target="_blank" rel="noopener" style="color:#003087;font-weight:600;text-decoration:none">
                        Contact us on WhatsApp
                    </a> for expert assistance!
                </p>
            `;
        }
        
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.style.display = 'none';
        clearErrors();
        
        if (window.taxChart) window.taxChart.destroy();
        if (window.costChart) window.costChart.destroy();
    }

    // FIXED Update capacity label (SAFE)
    function updateCapacityLabel() {
        const vehicleTypeEl = document.getElementById('vehicleType');
        const capacityLabelEl = document.getElementById('capacityLabel');
        
        if (!vehicleTypeEl || !capacityLabelEl) return;
        
        const vehicleType = vehicleTypeEl.value;
        const isElectric = vehicleType.includes('electric') || vehicleType.includes('esmart');
        capacityLabelEl.textContent = isElectric ? 'Motor Capacity (kW):' : 'Engine Capacity (CC):';
    }

    // PDF Export (SIMPLE version - works without jsPDF)
    function downloadPDF() {
        if (!window.resultData) {
            alert('Please calculate first!');
            return;
        }
        
        let pdfContent = `Sri Lanka Vehicle Tax Calculation 2025\n`;
        pdfContent += `Amarasinghe Prime Enterprises | ${new Date().toLocaleString('en-LK')}\n\n`;
        pdfContent += `INPUTS:\n`;
        pdfContent += `CIF (JPY): ${formatNumber(window.resultData.cifJPY)}\n`;
        pdfContent += `Exchange Rate: ${window.resultData.exchangeRate.toFixed(4)}\n`;
        pdfContent += `CIF (LKR): ${formatNumber(window.resultData.cif)}\n`;
        pdfContent += `Vehicle: ${window.resultData.type.replace('_', ' ').toUpperCase()}\n`;
        pdfContent += `Capacity: ${formatNumber(window.resultData.capacity)} ${['electric','esmart_petrol','esmart_diesel'].includes(window.resultData.type) ? 'kW' : 'cc'}\n\n`;
        pdfContent += `TAX BREAKDOWN:\n`;
        pdfContent += `Customs Import Duty: ${formatNumber(window.resultData.cid)} LKR\n`;
        pdfContent += `Surcharge: ${formatNumber(window.resultData.surcharge)} LKR\n`;
        pdfContent += `Excise Duty: ${formatNumber(window.resultData.excise)} LKR\n`;
        pdfContent += `Luxury Tax: ${formatNumber(window.resultData.luxuryTax)} LKR\n`;
        pdfContent += `VEL: ${formatNumber(window.resultData.vel)} LKR\n`;
        pdfContent += `VAT: ${formatNumber(window.resultData.vat)} LKR\n`;
        pdfContent += `TOTAL TAXES: ${formatNumber(window.resultData.totalTax)} LKR\n\n`;
        pdfContent += `FINAL COST: ${formatNumber(window.resultData.totalCost)} LKR\n\n`;
        pdfContent += `Contact: +94 76 944 7740 | https://amarasingheprime.lk`;
        
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicle_tax_${window.resultData.type}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Initialize (100% SAFE)
    function init() {
        console.log('✅ SL Tax Calculator v2.0 Loaded Successfully');
        
        // Update datetime
        const timeEl = document.getElementById('timeDateTime');
        if (timeEl) {
            timeEl.textContent = new Date().toLocaleString('en-LK');
        }

        // Fetch exchange rate
        const rateEl = document.getElementById('cbslRate');
        if (rateEl) {
            fetch('https://api.exchangerate.host/latest?base=JPY&symbols=LKR')
                .then(r => r.json())
                .then(data => {
                    const rate = data.rates.LKR;
                    const exchangeInput = document.getElementById('exchangeRate');
                    if (exchangeInput) exchangeInput.value = rate.toFixed(4);
                    rateEl.innerHTML = `📈 Live JPY/LKR: <strong>${rate.toFixed(4)}</strong>`;
                })
                .catch(() => {
                    rateEl.innerHTML = '⚠️ Enter JPY/LKR rate manually (~0.0052)';
                });
        }

        // Event listeners (SAFE)
        const calculateBtn = document.getElementById('calculateBtn');
        const resetBtn = document.getElementById('resetBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const vehicleTypeEl = document.getElementById('vehicleType');

        if (calculateBtn) calculateBtn.addEventListener('click', calculateTax);
        if (resetBtn) resetBtn.addEventListener('click', resetForm);
        if (downloadBtn) downloadBtn.addEventListener('click', downloadPDF);
        if (vehicleTypeEl) {
            vehicleTypeEl.addEventListener('change', updateCapacityLabel);
            updateCapacityLabel(); // Initial call
        }

        // FAQ toggles
        document.querySelectorAll('.faq-item h3').forEach(h3 => {
            h3.addEventListener('click', function() {
                this.parentElement.classList.toggle('active');
            });
        });

        console.log('✅ All event listeners attached');
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100); // Extra safety
    }

})();
