// Chart.js Integration for Weather Analytics

let tempChartInstance = null;

function renderTempChart(forecastData, isCelsius) {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;
    
    // We want the next 8 items (24 hours, 3-hour intervals)
    const list = forecastData.list.slice(0, 8);
    
    const labels = list.map(item => {
        const d = new Date((item.dt + currentForecastData.city.timezone) * 1000);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: window.timeFormat !== '24' });
    });
    
    const temps = list.map(item => {
        let t = item.main.temp;
        if (!isCelsius) {
            t = (t * 9/5) + 32;
        }
        return Math.round(t);
    });

    if (tempChartInstance) {
        tempChartInstance.destroy();
    }

    // Determine color based on general temp
    const avgTemp = temps.reduce((a,b) => a+b, 0) / temps.length;
    let colorHex = '#38BDF8'; // Blue-ish default
    if (isCelsius && avgTemp > 25 || !isCelsius && avgTemp > 77) {
        colorHex = '#f59e0b'; // Warm
    }

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature',
                data: temps,
                borderColor: colorHex,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, `${colorHex}80`); // 50% opacity
                    gradient.addColorStop(1, `${colorHex}00`); // 0% opacity
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colorHex,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colorHex,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { family: 'Inter', size: 13 },
                    bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + '°';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#cbd5e1',
                        font: { family: 'Inter' },
                        callback: function(value) {
                            return value + '°';
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}
