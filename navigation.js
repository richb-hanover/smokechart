let currentDataIndex = 0;
let fullData = [];

function updateTimeRangeDisplay(displayData) {
    const startTime = displayData[0][0];
    const endTime = displayData[displayData.length - 1][0];
    document.getElementById('time-range').textContent = 
        `Showing data from ${startTime} to ${endTime}`;
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    prevButton.disabled = currentDataIndex <= 0;
    nextButton.disabled = currentDataIndex >= Math.max(0, fullData.length - 24);
}

async function loadData() {
    try {
        const response = await fetch('ping.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        fullData = await response.json();
        
        currentDataIndex = Math.max(0, fullData.length - 24);
        updateChart();
    } catch (error) {
        console.error('Error loading data:', error);
        d3.select('#column-plot')
            .append('div')
            .attr('class', 'error')
            .text('Error loading ping.json. Please ensure the file exists and contains valid JSON data.');
    }
}

function updateChart() {
    const container = document.getElementById('column-plot');
    createColumnPlot(fullData, currentDataIndex, {
        width: container.clientWidth,
        height: container.clientHeight
    });
}

// Event listeners
document.getElementById('prevButton').addEventListener('click', () => {
    currentDataIndex = Math.max(0, currentDataIndex - 24);
    updateChart();
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentDataIndex + 24 < fullData.length) {
        currentDataIndex = Math.min(fullData.length - 24, currentDataIndex + 24);
        updateChart();
    }
});

// Handle window resize
window.addEventListener('resize', updateChart);

// Initial load
loadData();
