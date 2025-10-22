// taxCalculator.min.js - Complete Sri Lanka Vehicle Tax Calculator 2025
(function() {
    // Excise duty tables (exact Gazette rates)
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

    // Luxury tax thresholds
    const luxuryThresholds = {
        petrol: 5000000, diesel: 5000000, 
        petrol_hybrid: 5500000, diesel_hybrid: 5500000,
        petrol_plugin: 5500000, diesel_plugin: 5500000,
        electric: 6000000, esmart_petrol: 6000000, esmart_diesel: 6000000
    };

    // Luxury tax rates
    const luxuryRates = {
        petrol: 1.0, diesel: 1.2, 
        petrol_hybrid: 0.8, diesel_hybrid: 0.9,
        petrol_plugin: 0.8, diesel_plugin: 0.9,
        electric: 0.6, esmart_petrol: 0.6, esmart_diesel: 0.6
    };

    // Calculate excise duty
    function calculateExcise(type, capacity, age) {
        const table = exciseTables[type];
        if (!table) return { error: 'Invalid vehicle type' };

        // Minimum capacity validation
        const minCapacity = type.includes('petrol') && !type.includes('plugin') ? 600 : 
                          type.includes('diesel') ? 900 : 1;
        if (capacity < minCapacity) {
            return { error: `Enter valid engine capacity (minimum ${minCapacity} ${type.includes('electric') || type.includes('esmart') ? 'kW' : 'cc'})` };
        }

        for (let tier of table) {
            if (capacity <= tier.max) {
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

    // Format number
    function formatNumber(num) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // Main calculation function
    function calculateTax() {
        const cifJPY = parseFloat(document.getElementById('cifJPY').value);
        const exchangeRate = parseFloat(document.getElementById('exchangeRate').value);
        const type = document.getElementById('vehicleType').value;
        const capacity = parseFloat(document.getElementById('capacity').value);
        const age = document.getElementById('age').value;
        const dealerFee = parseFloat(document.getElementById('dealerFee').value) || 0;
        const clearingFee = parseFloat(document.getElementById('clearingFee').value) || 0;

        // Validation
        if (isNaN(cifJPY) || cifJPY <= 0) return showError('cifJPY', 'Please enter valid CIF value');
        if (isNaN(exchangeRate) || exchangeRate <= 0) return showError('exchangeRate', 'Please enter valid exchange rate');
        if (!type) return showError('vehicleType', 'Please select vehicle type');
        if (isNaN(capacity) || capacity <= 0) return showError('capacity', 'Please enter valid capacity');
        if (!age) return showError('age', 'Please select vehicle age');

        const cif = cifJPY * exchangeRate;
        const exciseResult = calculateExcise(type, capacity, age);
        if (exciseResult.error) return showError('capacity', exciseResult.error);

        const cid = cif * 0.2;
        const surcharge = cid * 0.5;
        const excise = exciseResult;
        const luxuryTax = calculateLuxuryTax(cif, type);
        const vel = 15000;
        const vatBase = (cif * 1.1) + cid + surcharge + excise + luxuryTax + vel; // 110% CIF uplift
        const vat = vatBase * 0.18;
        const totalTax = cid + surcharge + excise + luxuryTax + vel + vat;
        const otherCharges = dealerFee + clearingFee;
        const totalCost = cif + totalTax + otherCharges;

        // Store results for PDF
        window.resultData = { cifJPY, exchangeRate, cif, type, capacity, age, dealerFee, clearingFee, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges, totalCost };

        displayResults({ cif, cid, surcharge, excise, luxuryTax, vel, vat, totalTax, otherCharges, totalCost });
        showCharts({ cif, totalTax, otherCharges, cid, surcharge, excise, luxuryTax, vel, vat });
        document.getElementById('downloadBtn').style.display = 'flex';
        document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    }

    // Display results table
    function displayResults(data) {
        const unit = ['electric', 'esmart_petrol', 'esmart_diesel'].includes(window.resultData.type) ? 'kW' : 'cc';
        const ageText = window.resultData.age === '1' ? '≤1 year' : '>1–3 years';
        const typeText = window.resultData.type.replace('_', ' ').toUpperCase();

        const html = `
            <div style="font-weight:700;margin-bottom:0.75rem;color:var(--primary)">📋 Inputs Summary</div>
            <table>
                <thead><tr><th>Item</th><th style="text-align:right">Value</th></tr></thead>
                <tbody>
                    <tr><td>CIF (JPY)</td><td style="text-align:right">${formatNumber(window.resultData.cifJPY)}</td></tr>
                    <tr><td>Exchange Rate</td><td style="text-align:right">${window.resultData.exchangeRate.toFixed(4)}</td></tr>
                    <tr><td>CIF (LKR)</td><td style="text-align:right">${formatNumber(data.cif)}</td></tr>
                    <tr><td>Vehicle Type</td><td style="text-align:right">${typeText}</td></tr>
                    <tr><td>Capacity</td><td style="text-align:right">${formatNumber(window.resultData.capacity)} ${unit}</td></tr>
                    <tr><td>Age</td><td style="text-align:right">${ageText}</td></tr>
                </tbody>
            </table>
            
            <div style="font-weight:700;margin:1.25rem 0 0.75rem;color:var(--primary)">💰 Tax Breakdown</div>
            <table>
                <thead><tr><th>Tax Type</th><th style="text-align:right">Amount (LKR)</th><th style="text-align:right">% of Total Tax</th></tr></thead>
                <tbody>
                    <tr><td>Customs Import Duty</td><td style="text-align:right">${formatNumber(data.cid)}</td><td style="text-align:right">${((data.cid/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr><td>Surcharge (50% of CID)</td><td style="text-align:right">${formatNumber(data.surcharge)}</td><td style="text-align:right">${((data.surcharge/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr><td>Excise Duty</td><td style="text-align:right">${formatNumber(data.excise)}</td><td style="text-align:right">${((data.excise/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr><td>Luxury Tax</td><td style="text-align:right">${formatNumber(data.luxuryTax)}</td><td style="text-align:right">${((data.luxuryTax/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr><td>Vehicle Entitlement Levy</td><td style="text-align:right">${formatNumber(data.vel)}</td><td style="text-align:right">${((data.vel/data.totalTax)*100).toFixed(1)}%</td></tr>
                    <tr><td>VAT (18%)</td><td style="text-align:right">${formatNumber(data.vat)}</td><td style="text-align:right">${((data.vat/data.totalTax)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot>
                    <tr><td style="border-top:2px solid var(--primary);font-weight:bold">Total Taxes & Duties</td><td style="text-align:right;border-top:2px solid var(--primary);font-weight:bold">${formatNumber(data.totalTax)}</td><td style="text-align:right;border-top:2px solid var(--primary);font-weight:bold">100.0%</td></tr>
                </tfoot>
            </table>

            <div style="font-weight:700;margin:1.25rem 0 0.75rem;color:var(--primary)">🎯 Final Cost Summary</div>
            <table>
                <thead><tr><th>Item</th><th style="text-align:right">Amount (LKR)</th><th style="text-align:right">% of Total</th></tr></thead>
                <tbody>
                    <tr><td>Vehicle CIF Value</td><td style="text-align:right">${formatNumber(data.cif)}</td><td style="text-align:right">${((data.cif/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr><td>Total Taxes & Duties</td><td style="text-align:right">${formatNumber(data.totalTax)}</td><td style="text-align:right">${((data.totalTax/data.totalCost)*100).toFixed(1)}%</td></tr>
                    <tr><td>Other Charges</td><td style="text-align:right">${formatNumber(data.otherCharges)}</td><td style="text-align:right">${((data.otherCharges/data.totalCost)*100).toFixed(1)}%</td></tr>
                </tbody>
                <tfoot>
                    <tr><td style="border-top:2px solid var(--primary);font-weight:bold">💎 TOTAL IMPORT COST</td><td style="text-align:right;border-top:2px solid var(--primary);font-weight:bold">${formatNumber(data.totalCost)}</td><td style="text-align:right;border-top:2px solid var(--primary);font-weight:bold">100.0%</td></tr>
                </tfoot>
            </table>
        `;
        document.getElementById('result').innerHTML = html;
    }

    // Show pie charts
    function showCharts(data) {
        const ctx1 = document.getElementById('taxPieChart').getContext('2d');
        const ctx2 = document.getElementById('pieChart').getContext('2d');

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
    }

    // Error handling
    function showError(fieldId, message) {
        clearErrors();
        const input = document.getElementById(fieldId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        input.focus();
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        // Update datetime
        document.getElementById('timeDateTime').textContent = new Date().toLocaleString('en-LK');

        // Fetch exchange rate
        fetch('https://api.exchangerate.host/latest?base=JPY&symbols=LKR')
            .then(res => res.json())
            .then(data => {
                const rate = data.rates.LKR;
                document.getElementById('exchangeRate').value = rate.toFixed(4);
                document.getElementById('cbslRate').textContent = `📈 Current JPY/LKR: ${rate.toFixed(4)} (Live Rate)`;
            })
            .catch(() => {
                document.getElementById('cbslRate').textContent = '⚠️ Enter JPY/LKR rate manually';
            });

        // Capacity label update
        document.getElementById('vehicleType').addEventListener('change', function() {
            const isElectric = this.value.includes('electric') || this.value.includes('esmart');
            document.getElementById('capacityLabel').textContent = isElectric ? 
                'Motor Capacity (kW):' : 'Engine Capacity (CC):';
        });

        // FAQ toggle
        document.querySelectorAll('.faq-item h3').forEach(h3 => {
            h3.addEventListener('click', function() {
                this.parentElement.classList.toggle('active');
            });
        });

        // Calculate button
        document.getElementById('calculateBtn').addEventListener('click', calculateTax);

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', function() {
            document.getElementById('taxCalculatorForm').reset();
            document.getElementById('result').innerHTML = `
                <p class="result-placeholder">👆 Add input data and click Calculate Tax</p>
                <p class="result-help">Need help? <a href="https://wa.me/message/XSPMWKK4BGVAM1" target="_blank">WhatsApp us</a></p>
            `;
            document.getElementById('downloadBtn').style.display = 'none';
            clearErrors();
            if (window.taxChart) window.taxChart.destroy();
            if (window.costChart) window.costChart.destroy();
        });
    });
})();
