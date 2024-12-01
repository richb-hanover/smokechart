function createColumnPlot(data, startIndex, {
    width,
    height,
    margin = { top: 40, right: 40, bottom: 40, left: 60 },
    container = '#column-plot'
} = {}) {
    // Clear previous chart
    d3.select(container).selectAll("*").remove();

    // Get 24 hours of data starting from startIndex
    const displayData = data.slice(startIndex, startIndex + 24);
    
    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Get actual hours from the data for x-axis
    const hours = displayData.map(row => row[0].split(':')[0]);
    
    // Calculate column width
    const columnWidth = innerWidth / 24;

    // Create SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Find the extent of values (excluding "0/0" and timestamps)
    const allValues = displayData
        .flatMap(row => row.slice(1))
        .filter(v => v !== "0/0")
        .map(Number);
    const valueExtent = d3.extent(allValues);
    
    // Create scale for y-axis
    const yScale = d3.scaleLinear()
        .domain([valueExtent[0] - 1, valueExtent[1] + 1])
        .range([innerHeight, 0]);

    // Draw columns for each position
    displayData.forEach((row, index) => {
        const column = row.slice(1);  // Remove timestamp
        
        if (!column.includes("0/0")) {
            // Convert strings to numbers for calculations
            const numericColumn = column.map(Number);
            const sortedValues = [...numericColumn].sort((a, b) => a - b);

            // Calculate median and all deciles
            const median = d3.median(numericColumn);
            const deciles = Array.from({length: 11}, (_, i) => 
                i === 0 ? d3.min(sortedValues) :
                i === 10 ? d3.max(sortedValues) :
                d3.quantile(sortedValues, i/10)
            );

            // Draw bands from outside in
            const bandPairs = [
                {outer: 0, inner: 9, color: '#f0f0f0'},  // 0-10 & 90-100
                {outer: 1, inner: 8, color: '#e0e0e0'},  // 10-20 & 80-90
                {outer: 2, inner: 7, color: '#d0d0d0'},  // 20-30 & 70-80
                {outer: 3, inner: 6, color: '#c0c0c0'},  // 30-40 & 60-70
            ];

            bandPairs.forEach(({outer, inner, color}) => {
                // Draw lower band
                svg.append('rect')
                    .attr('x', index * columnWidth)
                    .attr('y', yScale(deciles[outer + 1]))
                    .attr('width', columnWidth)
                    .attr('height', yScale(deciles[outer]) - yScale(deciles[outer + 1]))
                    .attr('fill', color);

                // Draw upper band
                svg.append('rect')
                    .attr('x', index * columnWidth)
                    .attr('y', yScale(deciles[inner + 1]))
                    .attr('width', columnWidth)
                    .attr('height', yScale(deciles[inner]) - yScale(deciles[inner + 1]))
                    .attr('fill', color);
            });

            // Draw center band (40-60 percentile)
            svg.append('rect')
                .attr('x', index * columnWidth)
                .attr('y', yScale(deciles[6]))
                .attr('width', columnWidth)
                .attr('height', yScale(deciles[4]) - yScale(deciles[6]))
                .attr('fill', '#999999');

            // Draw median line
            svg.append('line')
                .attr('x1', index * columnWidth)
                .attr('x2', (index + 1) * columnWidth)
                .attr('y1', yScale(median))
                .attr('y2', yScale(median))
                .attr('stroke', '#007bff')
                .attr('stroke-width', 2);
        } else {
            // Handle error columns
            const validValues = column.filter(v => v !== "0/0").map(Number);
            if (validValues.length > 0) {
                const columnExtent = d3.extent(validValues);
                svg.append('rect')
                    .attr('x', index * columnWidth)
                    .attr('y', yScale(columnExtent[1]))
                    .attr('width', columnWidth)
                    .attr('height', yScale(columnExtent[0]) - yScale(columnExtent[1]))
                    .attr('fill', '#ffebee');
                    
                const median = d3.median(validValues);
                svg.append('line')
                    .attr('x1', index * columnWidth)
                    .attr('x2', (index + 1) * columnWidth)
                    .attr('y1', yScale(median))
                    .attr('y2', yScale(median))
                    .attr('stroke', '#007bff')
                    .attr('stroke-width', 2);
            } else {
                svg.append('rect')
                    .attr('x', index * columnWidth)
                    .attr('y', 0)
                    .attr('width', columnWidth)
                    .attr('height', innerHeight)
                    .attr('fill', '#ffebee');
            }
        }
    });

    // Add y-axis
    const yAxis = d3.axisLeft(yScale);
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Add x-axis with hour labels from the data
    const xScale = d3.scaleLinear()
        .domain([0, 23])
        .range([columnWidth/2, innerWidth - columnWidth/2]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(24)
        .tickFormat((d, i) => i < hours.length ? hours[i] : '');

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

    // Add labels
    svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .text('Hour');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle')
        .text('Response Time (ms)');

    updateTimeRangeDisplay(displayData);
    updateNavigationButtons();
}