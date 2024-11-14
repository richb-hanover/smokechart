function createColumnPlot(data, {
            width,
            height,
            margin = { top: 40, right: 40, bottom: 40, left: 60 },
            container = '#column-plot'
        } = {}) {
            // Clear previous chart
            d3.select(container).selectAll("*").remove();

            // Take only the last 24 rows
            const last24 = data.slice(-24);
            
            // Calculate inner dimensions
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            
            // Calculate column width
            const columnWidth = innerWidth / 24;

            // Create SVG container
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Find the extent of values (excluding "0/0")
            const allValues = last24.flat().filter(v => v !== "0/0").map(Number);
            const valueExtent = d3.extent(allValues);
            
            // Create scale for y-axis
            const yScale = d3.scaleLinear()
                .domain([valueExtent[0] - 1, valueExtent[1] + 1])
                .range([innerHeight, 0]);

            // First pass: Draw data columns
            last24.forEach((column, columnIndex) => {
                if (!column.includes("0/0")) {
                    // Convert strings to numbers for calculations
                    const numericColumn = column.map(Number);
                    
                    // Calculate statistics
                    const mean = d3.mean(numericColumn);
                    const sortedValues = [...numericColumn].sort((a, b) => a - b);
                    
                    // Calculate all percentiles
                    const p0 = d3.min(sortedValues);    // 0th percentile
                    const p10 = d3.quantile(sortedValues, 0.10);
                    const p25 = d3.quantile(sortedValues, 0.25);
                    const p75 = d3.quantile(sortedValues, 0.75);
                    const p90 = d3.quantile(sortedValues, 0.90);
                    const p100 = d3.max(sortedValues);  // 100th percentile
                    
                    // Draw outermost band (0-100%)
                    svg.append('rect')
                        .attr('x', columnIndex * columnWidth)
                        .attr('y', yScale(p100))
                        .attr('width', columnWidth)
                        .attr('height', yScale(p0) - yScale(p100))
                        .attr('fill', '#e0e0e0');  // Lightest gray

                    // Draw middle band (10-90%)
                    svg.append('rect')
                        .attr('x', columnIndex * columnWidth)
                        .attr('y', yScale(p90))
                        .attr('width', columnWidth)
                        .attr('height', yScale(p10) - yScale(p90))
                        .attr('fill', '#c0c0c0');  // Medium gray

                    // Draw inner band (25-75%)
                    svg.append('rect')
                        .attr('x', columnIndex * columnWidth)
                        .attr('y', yScale(p75))
                        .attr('width', columnWidth)
                        .attr('height', yScale(p25) - yScale(p75))
                        .attr('fill', '#999999');  // Darkest gray

                    // Draw mean line
                    svg.append('line')
                        .attr('x1', columnIndex * columnWidth)
                        .attr('x2', (columnIndex + 1) * columnWidth)
                        .attr('y1', yScale(mean))
                        .attr('y2', yScale(mean))
                        .attr('stroke', '#007bff')
                        .attr('stroke-width', 2);
                }
            });

            // Second pass: Draw error overlays
            last24.forEach((column, columnIndex) => {
                if (column.includes("0/0")) {
                    const validValues = column.filter(v => v !== "0/0").map(Number);
                    if (validValues.length > 0) {
                        // If there are valid values, draw error tint to match their extent
                        const columnExtent = d3.extent(validValues);
                        svg.append('rect')
                            .attr('x', columnIndex * columnWidth)
                            .attr('y', yScale(columnExtent[1]))
                            .attr('width', columnWidth)
                            .attr('height', yScale(columnExtent[0]) - yScale(columnExtent[1]))
                            .attr('fill', '#ffebee');
                        
                        // Draw mean line for valid values
                        const mean = d3.mean(validValues);
                        svg.append('line')
                            .attr('x1', columnIndex * columnWidth)
                            .attr('x2', (columnIndex + 1) * columnWidth)
                            .attr('y1', yScale(mean))
                            .attr('y2', yScale(mean))
                            .attr('stroke', '#007bff')
                            .attr('stroke-width', 2);
                    } else {
                        // If no valid values, draw error tint for full height
                        svg.append('rect')
                            .attr('x', columnIndex * columnWidth)
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

            // Create hours for x-axis labels
            const currentHour = new Date().getHours();
            const hours = Array.from({length: 24}, (_, i) => {
                let hour = (currentHour - 23 + i + 24) % 24;
                return hour.toString().padStart(2, '0');
            });

            // Add column indices on x-axis with hour labels
            const xScale = d3.scaleLinear()
                .domain([0, 23])
                .range([columnWidth/2, innerWidth - columnWidth/2]);

            const xAxis = d3.axisBottom(xScale)
                .ticks(24)
                .tickFormat((d) => hours[d]);

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
        }
