// Function to create a responsive plot that updates on window resize
function createResponsivePlot(groupedData, dates, currentDateIndex) {
    const date = dates[currentDateIndex];
    createColumnPlot(groupedData[date], 0, {
        container: '#column-plot'
    });
}

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

        // Create container for the buttons and title
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.width = '100%';
        headerDiv.style.maxWidth = '1200px';
        headerDiv.style.margin = '0 auto 10px auto';
        headerDiv.style.padding = '0 10px';
        
        // Create button styles
        const buttonStyle = `
            border: none;
            background: none;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: var(--title-font-size);
            padding: 5px;
            color: #666;
        `;

        const previousButton = document.createElement('button');
        previousButton.id = 'previous-button';
        previousButton.textContent = '← Previous Day';
        previousButton.style.cssText = buttonStyle;

        const laterButton = document.createElement('button');
        laterButton.id = 'later-button';
        laterButton.textContent = 'Next Day →';
        laterButton.style.cssText = buttonStyle;

        // Add buttons to header
        headerDiv.appendChild(previousButton);
        headerDiv.appendChild(laterButton);

        // Add the header before the plot container
        const container = document.querySelector('#column-plot');
        container.parentNode.insertBefore(headerDiv, container);

        previousButton.onclick = () => {
            if (currentDateIndex > 0) {
                currentDateIndex--;
                createResponsivePlot(groupedData, dates, currentDateIndex);
            }
            updateButtonStates();
        };

        laterButton.onclick = () => {
            if (currentDateIndex < dates.length - 1) {
                currentDateIndex++;
                createResponsivePlot(groupedData, dates, currentDateIndex);
            }
            updateButtonStates();
        };

        // Function to update button states
        const updateButtonStates = () => {
            previousButton.disabled = currentDateIndex === 0;
            laterButton.disabled = currentDateIndex === dates.length - 1;
            
            previousButton.style.visibility = currentDateIndex === 0 ? 'hidden' : 'visible';
            laterButton.style.visibility = currentDateIndex === dates.length - 1 ? 'hidden' : 'visible';
            
            previousButton.title = currentDateIndex > 0 ? 
                `View ${dates[currentDateIndex - 1]}` : '';
            laterButton.title = currentDateIndex < dates.length - 1 ? 
                `View ${dates[currentDateIndex + 1]}` : '';
        };

        // Initial plot and button states
        createResponsivePlot(groupedData, dates, currentDateIndex);
        updateButtonStates();

        // Add window resize handler
        window.addEventListener('resize', () => {
            createResponsivePlot(groupedData, dates, currentDateIndex);
        });

    } catch (error) {
        console.error('Error loading the data:', error);
        const container = document.querySelector('#column-plot');
        container.innerHTML = `<div style="color: red; padding: 20px;">
            Error loading data: ${error.message}
        </div>`;
    }
}

// Create necessary HTML elements
document.addEventListener('DOMContentLoaded', () => {
    // Create container for the plot
    const container = document.createElement('div');
    container.id = 'column-plot';
    container.style.width = '100%';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    document.body.appendChild(container);
    
    // Load and plot the data
    loadAndPlotData();
});