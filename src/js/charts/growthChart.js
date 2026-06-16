// growthChart.js
// Отрисовка графика роста капитала через Chart.js

(function () {
    'use strict';

    let chartInstance = null;

    /**
     * Рисует или перерисовывает график роста капитала
     * @param {Array} yearlyData - массив точек из futureValue.calculate().yearlyData
     */
    function drawGrowthChart(yearlyData) {
        const canvas = document.getElementById('growth-chart');
        if (!canvas) return;

        const labels = yearlyData.map(d => d.year === 0 ? 'Старт' : `${d.year} г.`);
        const balanceData    = yearlyData.map(d => d.balance);
        const investedData   = yearlyData.map(d => d.balance - d.totalInterest); // стартовый + взносы
        const interestData   = yearlyData.map(d => d.totalInterest);

        // Уничтожаем старый инстанс чтобы не было конфликта при пересчёте
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Итоговый баланс',
                        data: balanceData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        borderWidth: 2.5,
                        pointRadius: yearlyData.length > 20 ? 2 : 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.35
                    },
                    {
                        label: 'Вложено (капитал + взносы)',
                        data: investedData,
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.06)',
                        borderWidth: 2,
                        pointRadius: yearlyData.length > 20 ? 1 : 3,
                        pointHoverRadius: 5,
                        fill: true,
                        tension: 0.35
                    },
                    {
                        label: 'Доход от процентов',
                        data: interestData,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.06)',
                        borderWidth: 2,
                        pointRadius: yearlyData.length > 20 ? 1 : 3,
                        pointHoverRadius: 5,
                        fill: false,
                        tension: 0.35
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 12 }, padding: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                return ` ${ctx.dataset.label}: ${window.FinMath.formatCurrency(ctx.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            font: { size: 11 },
                            callback(val) {
                                if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + ' млн';
                                if (val >= 1_000)     return (val / 1_000).toFixed(0) + ' тыс';
                                return val;
                            }
                        }
                    }
                }
            }
        });
    }

    function destroyChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    window.Charts = { drawGrowthChart, destroyChart };
})();
