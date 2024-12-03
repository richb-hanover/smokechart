function createColumnPlot(displayData, startIndex, {
    container = '#column-plot'
} = {}) {
    // Clear previous chart and tooltips
    d3.select(container).selectAll("*").remove();
    d3.select("body").selectAll(".tooltip").remove();

    // Get container dimensions
    const containerDiv = document.querySelector(container);
    const width = containerDiv.clientWidth;
    const height = Math.min(window.innerHeight * 0.8, 600);
    const margin = { 
        top: Math.max(20, height * 0.067),
        right: Math.max(20, width * 0.033),
        bottom: Math.max(30, height * 0.1),
        left: Math.max(40, width * 0.05)
    };
    
    // Calculate title font size - expose this for use by the buttons
    const titleFontSize = `${Math.max(12, Math.min(16, width * 0.013))}px`;
    containerDiv.style.setProperty('--title-font-size', titleFontSize);

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

    // Find the date from the first available data row
    const date = displayData.find(row => row)?.[0] || 'Unknown Date';

    // Add title
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .style('font-size', titleFontSize)
        .style('font-weight', 'bold')
        .text(`Response Times for ${date}`);

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
    const formatTooltipDate = (row) => {
        const date = row[0];
        const hour = row[1].substring(0, 2);
        return `${date} ${hour}:00`;
    };

    // Find value extent across all data
    const allValues = displayData
        .flatMap(row => row ? row.slice(2).filter(v => v !== "0/0").map(Number) : [])
        .filter(v => !isNaN(v));
    const valueExtent = d3.extent(allValues);
    
    // Create scale for y-axis
    const yScale = d3.scaleLinear()
        .domain([valueExtent[0] - 1, valueExtent[1] + 1])
        .range([innerHeight, 0]);

    // Draw columns for all 24 hours
    for (let hour = 0; hour < 24; hour++) {
        const row = displayData[hour];
        const xPos = hour * columnWidth;

        if (row) {
            // Process and draw data for this hour
            const numericValues = row.slice(2).filter(v => v !== "0/0").map(Number);
            const hasError = row.slice(2).includes("0/0");
            
            const colors = {
                outer: '#f0f0f0',
                light: '#e0e0e0',
                medium: '#d0d0d0',
                dark: '#c0c0c0',
                center: '#999999',
                medianLine: hasError ? '#cc4c4c' : '#007bff'
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
                    .attr('stroke', colors.medianLine)
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
            if (hour >= 0 && hour < 24 && displayData[hour]) {
                const tooltipText = formatTooltipDate(displayData[hour]);
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
        .call(yAxis)
        .style('font-size', `${Math.max(10, Math.min(12, width * 0.01))}px`);

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
        .style("text-anchor", "middle")
        .style('font-size', `${Math.max(10, Math.min(12, width * 0.01))}px`);

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', `${Math.max(10, Math.min(12, width * 0.01))}px`)
        .text('Response Time (ms)');
}