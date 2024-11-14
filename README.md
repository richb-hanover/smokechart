# Smokechart 

![sample chart](./media/sample-smokechart.png)

Plot rows of data into columns in a "smoke chart" style.
Indicate the mean/average with a blue line;
25 to 75 percentiles in dark grey;
light grey indicates the full range of the data values.

The intended use is to plot the ping response times over time.
Each vertical bar represents a one-hour period
(as many as 120 samples at 30-second intervals).
Display only the most recent 24 hours.

If data samples are missing (say, the network was down),
tint the entire column with red.
Hours where there were valid data samples show the mean/average
with the blue bar.

The basics of this Javascript were generated
by a friendly session with Claude.ai.

## Data representation

The data provided to the chart function is an array of arrays.
Each individual array consists of an arbitrary number of samples:
the array "row" represents one hour of samples.
Missing samples are represented as NaN or "0/0" in the array.

The _pings2.json_ file has actual data for testing.

## Testing

```bash
cd smokechart
browser-sync start --server --files "css/*.css" "*.js*" "*.html" "*.md"
```

Here's a README description of the CreateColumnPlot() function:

## CreateColumnPlot Function

This function creates a visualization of time-series data showing statistical distributions across 24 hours. Each hour is represented by a vertical column showing the data distribution using three nested percentile bands.

### Parameters
```javascript
createColumnPlot(data, {
    width,           // Width of SVG in pixels
    height,          // Height of SVG in pixels
    margin = {       // Margins around the plot area
        top: 40,
        right: 40, 
        bottom: 40,
        left: 60
    },
    container = '#column-plot'  // CSS selector for container element
})
```

### Input Data Format
The input `data` should be an array of arrays, where:

- Each inner array represents one hour's worth of measurements
- Each element can be either a number or "0/0" (indicating an error)
- The last 24 rows of data are displayed
- Example: `[[14,15,"0/0",16], [15,16,16,"0/0"], ...]`

### Visual Elements

#### For Valid Data Columns

Three nested bands showing the distribution:

- Outer band (`#e0e0e0`): Shows the full range (0th-100th percentile)
- Middle band (`#c0c0c0`): Shows the 10th-90th percentile range
- Inner band (`#999999`): Shows the interquartile range (25th-75th percentile)
- Blue line (`#007bff`): Shows the mean value

#### For Error Data Columns

- Light red background (`#ffebee`): 
  - Full height if column contains only "0/0" values
  - Spans the range of valid values if column has mixed data
- Blue mean line is shown for columns with mixed valid/error data, calculated from valid values only

### Axes and Labels

- X-axis: Shows 24 hours in two-digit format (00-23), calculated from current time
- Y-axis: Shows the range of response times in milliseconds
- Axis labels: "Hour" and "Response Time (ms)"

### Responsive Behavior

- Automatically resizes when container dimensions change
- Maintains proper spacing and proportions at all sizes
- Recalculates column widths based on container width

### Usage Example

```javascript
const hourlyData = [ /* arrays of measurements */ ];
createColumnPlot(hourlyData, {
    width: 800,
    height: 400,
    container: '#my-container'
});
```

### Statistical Calculation Details

- 0th percentile: Minimum value in the dataset
- 10th percentile: Value below which 10% of observations fall
- 25th percentile: First quartile
- 75th percentile: Third quartile
- 90th percentile: Value below which 90% of observations fall
- 100th percentile: Maximum value in the dataset
- Mean: Arithmetic average of all valid values
