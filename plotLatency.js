// Main plotting function
function createColumnPlot(data, startIndex, {
    width,
    height,
    margin = { top: 40, right: 40, bottom: 40, left: 60 },
    container = '#column-plot'
} = {}) {
    // Clear previous chart and tooltips
    d3.select(container).selectAll("*").remove();
    d3.select("body").selectAll(".tooltip").remove();

    // Get data for display window
    const displayData = data.slice(startIndex, startIndex + 24);
    
    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Calculate column width for 24 hours
    const columnWidth = innerWidth / 24;

    // Create SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text('24 Hour Latency');

    // Create tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("text-align", "center");

    // Format timestamp for tooltip
    const formatTooltipDate = (timestamp) => {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const hour = date.getHours().toString().padStart(2, '0');
        return `${formattedDate} ${hour}:00`;
    };

    // Initialize hourly data array (24 slots, one for each hour)
    const hourlyData = new Array(24).fill(null);

    // Organize data by hour
    displayData.forEach(row => {
        if (!row) return;
        const timestamp = new Date(row[0]);
        const hour = timestamp.getHours();
        hourlyData[hour] = row;
    });

    // Find value extent across all data
    const allValues = displayData
        .flatMap(row => row ? row.slice(1).filter(v => v !== "0/0").map(Number) : [])
        .filter(v => !isNaN(v));
    const valueExtent = d3.extent(allValues);
    
    // Create scale for y-axis
    const yScale = d3.scaleLinear()
        .domain([valueExtent[0] - 1, valueExtent[1] + 1])
        .range([innerHeight, 0]);

    // Draw columns for all 24 hours
    for (let hour = 0; hour < 24; hour++) {
        const row = hourlyData[hour];
        const xPos = hour * columnWidth;

        if (row) {
            // Process and draw data for this hour
            const numericValues = row.slice(1).filter(v => v !== "0/0").map(Number);
            const hasError = row.slice(1).includes("0/0");
            
            const colors = hasError ? {
                outer: '#f5e6e6',
                light: '#e5d6d6',
                medium: '#d5c6c6',
                dark: '#c5b6b6',
                center: '#a59696'
            } : {
                outer: '#f0f0f0',
                light: '#e0e0e0',
                medium: '#d0d0d0',
                dark: '#c0c0c0',
                center: '#999999'
            };

            if (numericValues.length > 0) {
                const sortedValues = [...numericValues].sort((a, b) => a - b);
                const median = d3.median(numericValues);
                const deciles = Array.from({length: 11}, (_, i) => 
                    i === 0 ? d3.min(sortedValues) :
                    i === 10 ? d3.max(sortedValues) :
                    d3.quantile(sortedValues, i/10)
                );

                // Draw bands
                const bandPairs = [
                    {outer: 0, inner: 9, color: colors.outer},
                    {outer: 1, inner: 8, color: colors.light},
                    {outer: 2, inner: 7, color: colors.medium},
                    {outer: 3, inner: 6, color: colors.dark},
                ];

                bandPairs.forEach(({outer, inner, color}) => {
                    // Lower band
                    svg.append('rect')
                        .attr('x', xPos)
                        .attr('y', yScale(deciles[outer + 1]))
                        .attr('width', columnWidth)
                        .attr('height', yScale(deciles[outer]) - yScale(deciles[outer + 1]))
                        .attr('fill', color);

                    // Upper band
                    svg.append('rect')
                        .attr('x', xPos)
                        .attr('y', yScale(deciles[inner + 1]))
                        .attr('width', columnWidth)
                        .attr('height', yScale(deciles[inner]) - yScale(deciles[inner + 1]))
                        .attr('fill', color);
                });

                // Center band
                svg.append('rect')
                    .attr('x', xPos)
                    .attr('y', yScale(deciles[6]))
                    .attr('width', columnWidth)
                    .attr('height', yScale(deciles[4]) - yScale(deciles[6]))
                    .attr('fill', colors.center);

                // Median line
                svg.append('line')
                    .attr('x1', xPos)
                    .attr('x2', xPos + columnWidth)
                    .attr('y1', yScale(median))
                    .attr('y2', yScale(median))
                    .attr('stroke', '#007bff')
                    .attr('stroke-width', 2);
            }
        }
    }

    // Add large invisible rectangle for tooltip
    svg.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .on('mousemove', function(event) {
            const [mouseX] = d3.pointer(event);
            const hour = Math.floor(mouseX / columnWidth);
            if (hour >= 0 && hour < 24 && hourlyData[hour]) {
                const tooltipText = formatTooltipDate(hourlyData[hour][0]);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(tooltipText)
                    .style("left", `${event.pageX}px`)
                    .style("top", `${event.pageY - 40}px`);
            } else {
                tooltip.style("opacity", 0);
            }
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add axes
    const yAxis = d3.axisLeft(yScale);
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // X-axis with fixed 24-hour labels
    const xScale = d3.scaleLinear()
        .domain([0, 23])
        .range([columnWidth/2, innerWidth - columnWidth/2]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(24)
        .tickFormat(hour => hour.toString().padStart(2, '0'));

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

    // Get the date from the first available data point
    const firstDataPoint = displayData.find(row => row);
    const date = firstDataPoint ? new Date(firstDataPoint[0]) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Add labels
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .text(formattedDate);

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .text('Response Time (ms)');

    // Update navigation buttons state
    const previousButton = document.querySelector('#previous-button');
    const laterButton = document.querySelector('#later-button');
    
    if (previousButton) {
        const hasPreviousData = startIndex > 0 && data[startIndex - 1] !== undefined;
        previousButton.disabled = !hasPreviousData;
    }
    
    if (laterButton) {
        const hasLaterData = startIndex + 24 < data.length && data[startIndex + 24] !== undefined;
        laterButton.disabled = !hasLaterData;
    }
}