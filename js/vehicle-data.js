/* * VEHICLE INVENTORY DATA
 * Update this file to change the cars in the slider.
 * * Guide:
 * - image: The exact filename inside your 'vehicle-photos' folder.
 * - calcType: Must match values from your calculator (e.g., 'petrol', 'electric', 'petrol_hybrid').
 * - calcCapacity: Engine CC or Motor kW (just the number).
 * - calcCif: The JPY amount to auto-fill.
 */

const vehicleInventory = [
    {
        id: "car1",
        model: "Suzuki WagonR Fx (MH 85s)",
        badge: "Best Seller", // Optional badge (or leave empty "")
        specs: {
            year: "2024",
            mileage: "3,000 km",
            grade: "Safety Package",
            auction: "5"
        },
        price: "LKR 6,600,000",
        image: "wagonr.jpg", 
        
        // Calculator Auto-Fill Data
        calcType: "petrol",
        calcCapacity: 660,
        calcCif: 1300000
    },
    {
        id: "car2",
        model: "Daihatsu Mira (LA350S)",
        badge: "Best-value", 
        specs: {
            year: "2024",
            mileage: "5,000 km",
            grade: "L SAIII",
            auction: "5" 
        },
        price: "LKR 6,050,000",
        image: "mira.jpg",
        
        calcType: "petrol",
        calcCapacity: 660,
        calcCif: 1100000
    },
    {
        id: "car3",
        model: "Toyota Roomy (M900A)",
        badge: "Multi-purpose",
        specs: {
            year: "2025",
            mileage: "0 km",
            grade: "Custom GT",
            auction: "S"
        },
        price: "LKR 10,500,000",
        image: "roomy.jpg",
        
        calcType: "petrol",
        calcCapacity: 996,
        calcCif: 2400000
    }
];
