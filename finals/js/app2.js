// app2

// Import D3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Your dataset URL
const datasetURL = "data/fish_data.csv";

// Selected flavors for the y-axis
const selectedFlavors = ["smoked", "grilled", "citrus", "garlic", "chili_pepper", "tomato", "dairy"];

// Load data and create a heatmap
d3.csv(datasetURL).then(data => {
  // Count occurrences of each fish type
  const fishTypeCounts = d3.rollup(data, v => v.length, d => d.fish_type);
  
  // Get the top 8 most frequent fish types
  const topFishTypes = Array.from(fishTypeCounts, ([fishType, count]) => ({ fishType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(d => d.fishType);

  // Extract relevant data for heatmap
  const heatmapData = [];


  // Normalize the data by fish type
const normalizedHeatmapData = [];

topFishTypes.forEach(fishType => {
  const total = data.filter(d => d.fish_type === fishType).length; // Total count for the fish type
  selectedFlavors.forEach(flavor => {
    const count = data.filter(d => d.fish_type === fishType && d[flavor] === "Yes").length;
    const proportion = total > 0 ? count / total : 0; // Calculate proportion
    normalizedHeatmapData.push({
      fishType: fishType,
      flavor: flavor,
      proportion: proportion
    });
  });
});

  // Set up dimensions for the heatmap
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 30, left: 100 };

  // Create SVG container
  const svg = d3.select("#app2")  // Select the #app2 div
    .append("svg")  // Append an SVG element to #app2
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const xScale = d3.scaleBand()
    .domain(topFishTypes)
    .range([0, width])
    .padding(0.1);

  const yScale = d3.scaleBand()
    .domain(selectedFlavors)
    .range([0, height])
    .padding(0.1);

  // Adjust the color scale domain for proportions
    const colorScale = d3.scaleLinear()
        .domain([0, d3.max(normalizedHeatmapData, d => d.proportion)])
        .range(["white", "#69b3a2"]);

// Create and append the heatmap rectangles
svg.selectAll(".cell")
    .data(normalizedHeatmapData)
    .enter().append("rect")
    .attr("class", "cell")
    .attr("x", d => xScale(d.fishType))
    .attr("y", d => yScale(d.flavor))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .style("fill", d => colorScale(d.proportion))
    .on("mousemove", function (event, d) {
      const [x, y] = d3.pointer(event, svg.node());  // Ensure correct positioning
      const percentage = (d.proportion * 100).toFixed(2) + '%';
      tooltip
        .style("left", (x + 70) + "px")  // Adjust these values as needed
        .style("top", (y + 20) + "px")
        .style("opacity", 1)
        .html(`Fish Type: ${d.fishType}<br>Flavor: ${d.flavor}<br>Proportion: ${percentage}`);
    })
    .on("mouseleave", function () {
      tooltip.style("opacity", 0);
    });

    
  // Add x-axis and y-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .call(d3.axisLeft(yScale));

  // Create tooltip div
  const tooltip = d3.select("#app2")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
});