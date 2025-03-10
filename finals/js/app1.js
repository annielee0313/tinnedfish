import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const datasetURL = "data/fish_data.csv";

d3.csv(datasetURL).then(data => {
  // Extract the top 30 fish types by total count
  const topFishTypes = Array.from(d3.rollup(data, v => v.length, d => d.fish_type), ([fishType, count]) => ({ fishType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
    .map(d => d.fishType);

  // Filter data for the top 30 fish types
  const filteredData = data.filter(d => topFishTypes.includes(d.fish_type));

  // Create a data structure for counting countries for the top 5 fish types
  const stackedCountries = d3.rollup(filteredData, v => v.length, d => d.country, d => d.fish_type);

  // Sort countries by total count in descending order
  const sortedCountries = Array.from(stackedCountries, ([country, counts]) => ({
    country,
    counts: Array.from(counts, ([fishType, count]) => ({ fishType, count }))
      .sort((a, b) => b.count - a.count)
  }))
    .sort((a, b) => d3.sum(b.counts, d => d.count) - d3.sum(a.counts, d => d.count))
    .slice(0, 5)
    .reverse(); // Reverse the order of the array

  // Calculate the cumulative counts for each fish type within each country
  sortedCountries.forEach(countryData => {
    let cumulativeCount = 0;
    countryData.counts.forEach(d => {
      d.cumulativeCount = cumulativeCount;
      cumulativeCount += d.count;
    });
  });

  // Set up dimensions for the chart
  const width = 1000;
  const height = 600;
  const margin = { top: 30, right: 100, bottom: 50, left: 160 };

  // Adjust SVG dimensions to include grid-style legend below the chart
  const svgWidth = width + margin.left + margin.right;
  const svgHeight = height + margin.top + margin.bottom + 150; // Additional space for the grid legend

  // Create SVG container
  const svg = d3.select("#app1")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(sortedCountries, d => d3.max(d.counts, d => d.cumulativeCount + d.count))])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(sortedCountries.map(d => d.country))
    .range([height, 0])
    .padding(0.1);

    const customColors = [
      "#dd61ab", "#bbedff", "#7adfca", "#5b9b60", "#FFD700", 
      "#0d5b39", "#0091ed", "#fab1c5", "#15709f", "#007f89", 
      "#fff600", "#fea500", "#6479d7", "#c5b6a4", "#61421f", 
      "#00e380", "#c00170", "#e86371", "#a8c932", "#fd0000", 
      "#d3653e", "#80262d", "#ede4c1", "#af6e90", "#e49977", 
      "#9eb059", "#ff6a7a", "#37d4fc", "#de9f1b", "#b24622", 
  ];

  // Set up color scale with the custom color array
  const colorScale = d3.scaleOrdinal()
    .domain(topFishTypes)
    .range(customColors);

  // Create and append the horizontal stacked bars
  svg.selectAll(".bar")
    .data(sortedCountries)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", d => `translate(0,${yScale(d.country)})`)
    .selectAll("rect")
    .data(d => d.counts)
    .enter()
    .append("rect")
    .attr("class", d => `segment segment-${d.fishType.replace(/\s+/g, '-')}`)
    .attr("x", d => xScale(d.cumulativeCount))
    .attr("y", 0)
    .attr("width", d => xScale(d.count))
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(d.fishType));

  // Modify the Y-axis to include the total count
  svg.append("g")
  .call(d3.axisLeft(yScale)
    .tickSize(0)
    .tickPadding(10)
    .tickFormat(d => {
      // Find the corresponding country object
      const countryData = sortedCountries.find(c => c.country === d);
      // Calculate the total count for this country
      const totalCount = countryData ? d3.sum(countryData.counts, c => c.count) : 0;
      // Return the formatted tick label with both country name and count
      return `${d} (${totalCount})`;
    }))
  .selectAll("text") // Select all tick labels
    .attr("class", "axis-tick-label"); // Apply a class
  

//tooltip
const tooltip = d3.select("#app1")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip2")
  .style("position", "absolute")
  .style("pointer-events", "none");

const tooltipWidth = 10; // Set to the actual width of your tooltip
const tooltipHeight = 10; // Set to the actual height of your tooltip

const mouseover = function (event, d) {
  tooltip.style("opacity", 1);
};

const mousemove = function (event, d) {
  const imageName = `${d.fishType.toLowerCase()}.png`;

  const tooltipContent = `
    <div class="tooltip-content">
      <div class="tooltip2-image">
        <img src="images/${imageName}" alt="${d.fishType} Image">
      </div>
      <div class="tooltip2-text">
        ${d.fishType}: ${d.count}
      </div>
    </div>
  `;

  tooltip.html(tooltipContent)
    .style("left", `${event.pageX}px`)
    .style("top", `${event.pageY}px`)
    .style("width", tooltipWidth + "px")
    .style("height", tooltipHeight + "px");
};

const mouseleave = function (event, d) {
  tooltip.style("opacity", 0);
};

svg.selectAll("rect")
  .on("mouseover", function (event, d) {
    mouseover(event, d);
  })
  .on("mousemove", function (event, d) {
    mousemove(event, d);
  })
  .on("mouseout", function () {
    mouseleave();
  });

    
  // Legend settings
  const legendX = margin.left - 300;
  const legendY = height + margin.top + 30; // Positioning the legend below the chart
  const legendItemWidth = 40; // Width for each legend item
  const legendRows = 3; // Number of rows in the legend
  const legendColumnWidth = svgWidth / 10; // Divide width evenly for 10 items

  // Create a group for the legend
  const legend = svg.append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`);

  // Add legend items
  topFishTypes.forEach((fishType, index) => {
    const columnIndex = index % 10;
    const rowIndex = Math.floor(index / 10);
    
    legend.append('rect')
        .attr('x', columnIndex * legendColumnWidth)
        .attr('y', rowIndex * legendItemWidth)
        .attr('width', 12)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('height', 20)
        .style('fill', colorScale(fishType))
        .on('mouseover', () => {
          svg.selectAll(`.segment-${fishType.replace(/\s+/g, '-')}`)
            .style('opacity', 0.3); // Highlight bars
        })
        .on('mouseout', () => {
          svg.selectAll(`.segment-${fishType.replace(/\s+/g, '-')}`)
            .style('opacity', 1); // Reset opacity
        });

        legend.append('text')
        .attr('x', columnIndex * legendColumnWidth + 20)
        .attr('y', rowIndex * legendItemWidth + 12)
        .text(fishType)
        .style('font-size', '21px')
        .attr('alignment-baseline', 'middle')
        .style('font-family', 'monotalic-narrow, sans-serif') // Specify the font family
        .style('text-transform', 'capitalize') // Apply Title Case style
        .on('mouseover', () => {
          svg.selectAll(`.segment-${fishType.replace(/\s+/g, '-')}`)
            .transition()
            .duration(200) // Animation duration in milliseconds
            .style('opacity', 0.5); // Change opacity to 0.5 on mouseover
        })
        .on('mouseout', () => {
          svg.selectAll(`.segment-${fishType.replace(/\s+/g, '-')}`)
            .transition()
            .duration(200) // Animation duration in milliseconds
            .style('opacity', 1); // Reset opacity to 1 on mouseout
        })        
  });
});