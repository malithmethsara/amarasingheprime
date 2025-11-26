// 16. Draw Exchange Rate History Chart (Simple & Reliable)
    function drawExchangeRateChart() {
        const ctx = getElementSafe('exchangeRateChart');
        if (!ctx) return;

        fetch('rates.txt')
            .then(r => r.text())
            .then(text => {
                const lines = text.trim().split('\n').filter(line => line.trim() !== "");
                const recentLines = lines.slice(-12); 
                
                const labels = [];
                const dataPoints = [];

                recentLines.forEach(line => {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        labels.push(parts[0].trim());
                        dataPoints.push(parseFloat(parts[1].trim()));
                    }
                });

                // Chart.js is now loaded in HTML, so we can use it directly
                if (window.Chart) {
                    if (window.exchangeChartInstance) window.exchangeChartInstance.destroy();
                    
                    window.exchangeChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Exchange Rate',
                                data: dataPoints,
                                borderColor: '#003087',
                                backgroundColor: 'rgba(0, 48, 135, 0.05)',
                                borderWidth: 2,
                                tension: 0.3,
                                fill: true,
                                pointRadius: 3,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#003087'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: { display: true }
                            }
                        }
                    });
                } else {
                    console.error("Chart.js library not found");
                }
            })
            .catch(err => console.error("Chart failed to load:", err));
    }
