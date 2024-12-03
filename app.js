// Function to load and process data
async function loadAndPlotData() {
    try {
        // Fetch the JSON file from the local directory
        const response = await fetch('ping3.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();

        // Group data by date
        const groupedData = {};
        rawData.forEach(row => {
            const date = row[0];
            if (!groupedData[date]) {
                groupedData[date] = new Array(24).fill(null);
            }
            const hour = parseInt(row[1].substring(0, 2));
            groupedData[date][hour] = row;
        });

        console.log('Grouped data by date:', groupedData);

        // Get sorted list of dates
        const dates = Object.keys(groupedData).sort();
        let currentDateIndex = 0;

        // Initial plot with first date's data
        const initialDate = dates[currentDateIndex];
        console.log('Starting with date:', initialDate);
        createColumnPlot(groupedData[initialDate], 0, {
            width: 1200,
            height: 600,
            container: '#column-plot'
        });

        // Add navigation buttons
        const controlsDiv = document.createElement('div');
        controlsDiv.style.textAlign = 'center';
        controlsDiv.style.marginTop = '10px';

        const previousButton = document.createElement('button');
        previousButton.id = 'previous-button';
        previousButton.textContent = 'Previous Day';
        previousButton.onclick = () => {
            if (currentDateIndex > 0) {
                currentDateIndex--;
                const newDate = dates[currentDateIndex];
                console.log('Showing date:', newDate);
                createColumnPlot(groupedData[newDate], 0, {
                    width: 1200,
                    height: 600,
                    container: '#column-plot'
                });
            }
            updateButtonStates();
        };

        const laterButton = document.createElement('button');
        laterButton.id = 'later-button';
        laterButton.textContent = 'Next Day';
        laterButton.onclick = () => {
            if (currentDateIndex < dates.length - 1) {
                currentDateIndex++;
                const newDate = dates[currentDateIndex];
                console.log('Showing date:', newDate);
                createColumnPlot(groupedData[newDate], 0, {
                    width: 1200,
                    height: 600,
                    container: '#column-plot'
                });
            }
            updateButtonStates();
        };

        // Function to update button states
        const updateButtonStates = () => {
            previousButton.disabled = currentDateIndex === 0;
            laterButton.disabled = currentDateIndex === dates.length - 1;
            
            // Optional: Add date to button labels
            previousButton.title = currentDateIndex > 0 ? 
                `View ${dates[currentDateIndex - 1]}` : '';
            laterButton.title = currentDateIndex < dates.length - 1 ? 
                `View ${dates[currentDateIndex + 1]}` : '';
        };

        controlsDiv.appendChild(previousButton);
        controlsDiv.appendChild(laterButton);

        // Add the controls after the chart container
        const container = document.querySelector('#column-plot');
        container.parentNode.insertBefore(controlsDiv, container.nextSibling);

        // Set initial button states
        updateButtonStates();

    } catch (error) {
        console.error('Error loading the data:', error);
        // Add error message to the page
        const container = document.querySelector('#column-plot');
        container.innerHTML = `<div style="color: red; padding: 20px;">
            Error loading data: ${error.message}
        </div>`;
    }
}

// Create necessary HTML elements
document.addEventListener('DOMContentLoaded', () => {
    // Create container for the plot if it doesn't exist
    if (!document.querySelector('#column-plot')) {
        const container = document.createElement('div');
        container.id = 'column-plot';
        document.body.appendChild(container);
    }
    
    // Load and plot the data
    loadAndPlotData();
});