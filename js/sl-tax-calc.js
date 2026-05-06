/*
* Copyright © 2026 Amarasinghe Prime. All Rights Reserved.
* Official Calculation Logic - Adjusted for 2026 Gazette & Real World CUSDEC
*/
(function() {
    'use strict';

    let resultData = null;
    let taxChart = null;
    let costChart = null;

    // --- YOUR OFFICIAL EXCISE DUTY TABLES ---
    const exciseRates = {
        petrol: [
            { min: 600, max: 1000, rate: (cc) => Math.max(2450 * cc, 1992000) },
            { max: 1300, rate: 3850 }, { max: 1500, rate: 4450 }, { max: 1600, rate: 5150 },
            { max: 1800, rate: 6400 }, { max: 2000, rate: 7700 }, { max: 2500, rate: 8450 },
            { max: 2750, rate: 9650 }, { max: 3000, rate: 10850 }, { max: 4000, rate: 12050 },
            { max: 6500, rate: 13300 }
        ],
        petrol_hybrid: [
            { min: 600, max: 1000, rate: () => 1810900 },
            { max: 1300, rate: 2750 }, { max: 1500, rate: 3450 }, { max: 1600, rate: 4800 },
            { max: 1800, rate: 6300 }, { max: 2000, rate: 6900 }, { max: 2500, rate: 7250 },
            { max: 2750, rate: 8450 }, { max: 3000, rate: 9650 }, { max: 4000, rate: 10850 },
            { max: 6500, rate: 12050 }
        ],
        petrol_plugin: [
            { min: 600, max: 1000, rate: () => 1810900 },
            { max: 1300, rate: 2750 }, { max: 1500, rate: 3450 }, { max: 1600, rate: 4800 },
            { max: 1800, rate: 6250 }, { max: 2000, rate: 6900 }, { max: 2500, rate: 7250 },
            { max: 2750, rate: 8450 }, { max: 3000, rate: 9650 }, { max: 4000, rate: 10850 },
            { max: 6500, rate: 12050 }
        ],
        diesel: [
            { min: 900, max: 1500, rate: 5500 }, { max: 1600, rate: 6950 }, { max: 1800, rate: 8300 },
            { max: 2000, rate: 9650 }, { max: 2500, rate: 9650 }, { max: 2750, rate: 10850 },
            { max: 3000, rate: 12050 }, { max: 4000, rate: 13300 }, { max: 6500, rate: 14500 }
        ],
        diesel_hybrid: [
            { min: 900, max: 1000, rate: 4150 }, { max: 1500, rate: 4150 }, { max: 1600, rate: 5500 },
            { max: 1800, rate: 6900 }, { max: 2000, rate: 8350 }, { max: 2500, rate: 8450 },
            { max: 2750, rate: 9650 }, { max: 3000, rate: 10850 }, { max: 4000, rate: 12050 },
            { max: 6500, rate: 13300 }
        ],
        electric: [
            { min: 1, max: 50, rate: (age) => age === '1' ? 18100 : 36200 },
            { max: 100, rate: (age) => age === '1' ? 24100 : 36200 },
            { max: 200, rate: (age) => age === '1' ? 36200 : 60400 },
            { max: 600, rate: (age) => age === '1' ? 96600 : 132800 }
        ]
        // ... (Remaining types mapping to your original logic)
    };

    const luxuryThresholds = { petrol: 5000000, diesel: 5000000, petrol_hybrid: 5500000, electric: 6000000 };
    const luxuryRates = { petrol: 1.0, diesel: 1.2, petrol_hybrid: 0.8, electric: 0.6 };

    function formatNumber(num) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function getElementSafe(id) { return document.getElementById(id); }

    function calculateTax() {
        const calcBtn = getElementSafe('calculateBtn');
        const originalBtnText = calcBtn.innerHTML;
        
        // --- UI LOADING STATE ---
        calcBtn.disabled = true;
        calcBtn.innerHTML = `<span class="loading-spinner"></span> CALCULATING...`;

        setTimeout(() => {
            const cifJPY = parseFloat(getElementSafe('cifJPY').value) || 0;
            const exchangeRate = parseFloat(getElementSafe('exchangeRate').value) || 0;
            const type = getElementSafe('vehicleType').value;
            const capacity = parseFloat(getElementSafe('capacity').value) || 0;
            const age = getElementSafe('age').value;
            const dealerFee = parseFloat(getElementSafe('dealerFee').value) || 0;
            const clearingFee = parseFloat(getElementSafe('clearingFee').value) || 0;
            const bankFee = parseFloat(getElementSafe('bankLcFee').value) || 0;

            const cif = cifJPY * exchangeRate;
            const cid = cif * 0.30;
            
            // Logic for Excise
            let excise = 0;
            const table = exciseRates[type];
            if (table) {
                for (let tier of table) {
                    if (capacity >= (tier.min || 0) && capacity <= tier.max) {
                        excise = (typeof tier.rate === 'function' ? tier.rate(capacity || age) : tier.rate) * (type.includes('electric') ? capacity : (capacity > 1000 ? capacity : 1));
                        break;
                    }
                }
            }

            const luxuryTax = cif > (luxuryThresholds[type] || 5000000) ? (cif - (luxuryThresholds[type] || 5000000)) * (luxuryRates[type] || 1.0) : 0;
            const taxBase = cif + (cif * 0.10) + cid + excise;
            const sscl = taxBase * 0.025;
            const vat = taxBase * 0.18;
            const otherTaxes = 15000 + 1750;

            const totalTax = cid + excise + sscl + vat + luxuryTax + otherTaxes;
            const totalOther = dealerFee + clearingFee + bankFee;
            const totalCost = cif + totalTax + totalOther;

            resultData = { cifJPY, exchangeRate, cif, type, capacity, age, totalTax, totalCost, cid, excise, sscl, vat, luxuryTax, otherCharges: totalOther };

            displayResults(resultData);
            getElementSafe('downloadBtn').style.display = 'flex';
            
            calcBtn.disabled = false;
            calcBtn.innerHTML = originalBtnText;
        }, 600);
    }

    // --- ENHANCED UI: Dashboard display ---
    function displayResults(data) {
        const unit = data.type.includes('electric') ? 'kW' : 'cc';
        const html = `
            <div class="result-hero-card">
                <span style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; font-weight: 700;">Estimated Total Cost</span>
                <div style="font-size: 2.8rem; font-weight: 800; margin: 0.5rem 0;">LKR ${formatNumber(data.totalCost)}</div>
                <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 50px; font-size: 0.85rem;">
                    CIF ¥${formatNumber(data.cifJPY)} @ ${data.exchangeRate.toFixed(4)}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.5rem;">
                <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="font-size: 0.7rem; color: var(--muted); font-weight: 700;">Vehicle Info</div>
                    <div style="font-weight: 700; color: var(--primary);">${data.capacity} ${unit} ${data.type.toUpperCase()}</div>
                </div>
                <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
                    <div style="font-size: 0.7rem; color: var(--muted); font-weight: 700;">Total Tax</div>
                    <div style="font-weight: 700; color: var(--accent);">LKR ${formatNumber(data.totalTax)}</div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${renderRow("Customs Duty (CID 30%)", data.cid)}
                ${renderRow("Excise Duty (XID)", data.excise)}
                ${renderRow("SSL (2.5%)", data.sscl)}
                ${renderRow("VAT (18%)", data.vat)}
                ${renderRow("Luxury Tax", data.luxuryTax)}
                ${renderRow("Handling Fees", data.otherCharges)}
            </div>
        `;
        getElementSafe('result').innerHTML = html;
    }

    function renderRow(label, value) {
        return `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: white; border: 1px solid var(--border); border-radius: 10px;">
                <span style="font-size: 0.85rem; color: var(--muted);">${label}</span>
                <span style="font-weight: 700; color: var(--primary);">LKR ${formatNumber(value)}</span>
            </div>
        `;
    }

    // --- INITIALIZATION ---
    function init() {
        getElementSafe('calculateBtn').addEventListener('click', calculateTax);
        getElementSafe('vehicleType').addEventListener('change', () => {
            const isElectric = getElementSafe('vehicleType').value.includes('electric');
            getElementSafe('capacityLabel').textContent = isElectric ? 'Motor Capacity (kW):' : 'Engine Capacity (CC):';
        });

        // Reviews Time Calculation
        document.querySelectorAll('.r-meta[data-date]').forEach(el => {
            const date = new Date(el.getAttribute('data-date'));
            const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 30));
            el.textContent = diff + " months ago";
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
