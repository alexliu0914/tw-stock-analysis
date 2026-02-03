// 圖表管理模組
let priceChart = null;
let kdChart = null;

/**
 * 初始化或更新價格圖表
 */
function updatePriceChart(data) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    // 銷毀舊圖表
    if (priceChart) {
        priceChart.destroy();
    }

    // 準備數據 - 使用最近30天的數據
    const dates = data.dates || generateDateLabels(30);
    const prices = data.prices || [];
    const ma5 = data.ma5Array || [];
    const ma13 = data.ma13Array || [];
    const ma21 = data.ma21Array || [];
    const ma34 = data.ma34Array || [];
    const ma55 = data.ma55Array || [];
    const ma144 = data.ma144Array || [];

    // 創建新圖表
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: '收盤價',
                    data: prices,
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(129, 140, 248, 0.1)',
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    order: 1
                },
                {
                    label: 'MA5 (情緒)',
                    data: ma5,
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 2
                },
                {
                    label: 'MA13 (方向)',
                    data: ma13,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 3
                },
                {
                    label: 'MA21 (態度)',
                    data: ma21,
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 4
                },
                {
                    label: 'MA34 (趨勢)',
                    data: ma34,
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 5
                },
                {
                    label: 'MA55 (生命)',
                    data: ma55,
                    borderColor: '#ec4899',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 6
                },
                {
                    label: 'MA144 (生死)',
                    data: ma144,
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    order: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 11,
                            family: "'Noto Sans TC', sans-serif"
                        },
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += 'NT$ ' + context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        callback: function (value) {
                            return 'NT$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

/**
 * 初始化或更新 KD 圖表
 */
function updateKDChart(data) {
    const ctx = document.getElementById('kdChart');
    if (!ctx) return;

    // 銷毀舊圖表
    if (kdChart) {
        kdChart.destroy();
    }

    // 準備數據
    const dates = data.dates || generateDateLabels(30);
    const kValues = data.kValues || [];
    const dValues = data.dValues || [];

    // 創建新圖表
    kdChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'K值',
                    data: kValues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 5
                },
                {
                    label: 'D值',
                    data: dValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            family: "'Noto Sans TC', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 80,
                            yMax: 80,
                            borderColor: '#f59e0b',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: '超買 (80)',
                                enabled: true,
                                position: 'end'
                            }
                        },
                        line2: {
                            type: 'line',
                            yMin: 20,
                            yMax: 20,
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: '超賣 (20)',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10
                        },
                        stepSize: 20
                    }
                }
            }
        }
    });
}

/**
 * 生成日期標籤
 */
function generateDateLabels(days) {
    const labels = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(formatDate(date));
    }

    return labels;
}

/**
 * 格式化日期
 */
function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
}

/**
 * 清除所有圖表
 */
function clearCharts() {
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }
    if (kdChart) {
        kdChart.destroy();
        kdChart = null;
    }
}
