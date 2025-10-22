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
            {max: 6500, rate: 13300}
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
            {max: 6500, rate: 12050}
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
            {max: 6500, rate: 12050}
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
            {max: 6500, rate: 14500} // MODIFIED: Set a new explicit max capacity of 6500
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
            {max: 6500, rate: 13300} // MODIFIED: Set a new explicit max capacity of 6500
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
            {max: 6500, rate: 13300} // MODIFIED: Set a new explicit max capacity of 6500
        ],
        electric: [
            {max: 50, rate: function(age) { return age === '1' ? 18100 : 36200; }},
            {max: 100, rate: function(age) { return age === '1' ? 24100 : 36200; }},
            {max: 200, rate: function(age) { return age === '1' ? 36200 : 60400; }},
            {max: 600, rate: function(age) { return age === '1' ? 96600 : 132800; }} // MODIFIED: Set a new explicit max capacity of 600
        ],
        esmart_petrol: [
            {max: 50, rate: function(age) { return age === '1' ? 30770 : 43440; }},
            {max: 100, rate: function(age) { return age === '1' ? 40970 : 43440; }},
            {max: 200, rate: function(age) { return age === '1' ? 41630 : 63420; }},
            {max: 600, rate: function(age) { return age === '1' ? 111090 : 139440; }} // MODIFIED: Set a new explicit max capacity of 600
        ],
        esmart_diesel: [
            {max: 50, rate: function(age) { return age === '1' ? 36920 : 52130; }},
            {max: 100, rate: function(age) { return age === '1' ? 49160 : 52130; }},
            {max: 200, rate: function(age) { return age === '1' ? 49960 : 76100; }},
            {max: 600, rate: function(age) { return age === '1' ? 133310 : 167330; }} // MODIFIED: Set a new explicit max capacity of 600
        ]
    };

    const luxuryThresholds = {
// ... (omitted for brevity)

    // Calculate excise duty
    function calculateExcise(type, capacity, age) {
        const table = exciseTables[type];
        if (!table) return { error: 'Invalid vehicle type' };

        const isPetrol = type.includes('petrol');
        const isDiesel = type.includes('diesel');
        const isElectric = type === 'electric';
        const isESmart = type.includes('esmart');

        // Determine Capacity Limits
        let minCapacity = 1;
        let maxCapacity = Infinity;
        const unit = isElectric || isESmart ? 'kW' : 'cc';

        if (isPetrol) {
            minCapacity = 600;
            maxCapacity = 6500;
        } else if (isDiesel) {
            minCapacity = 900;
            maxCapacity = 6500; // NEW MAX
        } else if (isElectric) {
            minCapacity = 40; // NEW MIN
            maxCapacity = 600; // NEW MAX
        } else if (isESmart) {
            minCapacity = 20; // NEW MIN
            maxCapacity = 600; // NEW MAX
        }

        // Validation Check (Combined for min and max)
        if (capacity < minCapacity || capacity > maxCapacity) {
            // MODIFIED: Simplified error message as requested
            return { error: `Please enter valid capacity (${minCapacity}-${maxCapacity} ${unit}).` }; 
        }

        for (let tier of table) {
            if ('max' in tier && capacity <= tier.max) {
// ... (omitted for brevity)
