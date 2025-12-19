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
        model: "Suzuki WagonR Fx MH 85s ",
        badge: "Best Seller", // Optional badge (or leave empty "")
        specs: {
            year: "2024",
            mileage: "3,000 km",
            grade: "Safety Package",
            auction: "5"
        },
        price: "LKR 6,600,000",
        image: "wagonr.jpg", // Must match file in vehicle-photos folder
        
        // Calculator Auto-Fill Data
        calcType: "petrol_hybrid",
        calcCapacity: 660,
        calcCif: 1250000
    },
    {
        id: "car2",
        model: "Toyota Vitz (KSP130)",
        badge: "", 
        specs: {
            year: "2019",
            mileage: "12,000 km",
            grade: "F Safety",
            auction: "4.5" // High auction grade is a selling point!
        },
        price: "LKR 6,800,000",
        image: "vitz.jpg",
        
        calcType: "petrol",
        calcCapacity: 1000,
        calcCif: 1600000
    },
    {
        id: "car3",
        model: "Nissan Leaf (ZE1)",
        badge: "Electric",
        specs: {
            year: "2018",
            mileage: "40,000 km",
            grade: "G Grade",
            auction: "4.0"
        },
        price: "LKR 5,900,000",
        image: "leaf.jpg",
        
        calcType: "electric",
        calcCapacity: 110,
        calcCif: 950000
    }
];
