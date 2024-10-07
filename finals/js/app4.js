// Import D3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Dataset URL
const datasetURL = "data/fish_data.csv";

// Default background image URL
const defaultBackgroundImageURL = "images/sardines.png"; // Set the URL of your default image

// Function to set the background image
function setBackgroundImage(imageURL) {
  d3.select("#app4")
    .style("background-image", `url(${imageURL})`)
    .style("background-repeat", "no-repeat") // Prevent background from repeating
    .style("transition", "background-image 0.5s ease-in-out")
    .style("background-size", "50% auto") // Adjust background size as needed
    .style("background-position", "center center"); // Adjust background position as needed
}

// Load data
d3.csv(datasetURL).then(data => {
  // Count occurrences of each fish type
  const fishTypeCounts = d3.rollup(data, v => v.length, d => d.fish_type);

  // Get the top 8 most frequent fish types
  const topFishTypes = Array.from(fishTypeCounts, ([fishType, count]) => ({ fishType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(d => d.fishType);

  // Set the initial background image
  setBackgroundImage(`images/${topFishTypes[0]}.png`);

  // Create buttons for each top fish type
  const buttonColors = ["#dd61ab", "#bbedff", "#7adfca", "#5b9b60", "#FFD700", "#0d5b39", "#0091ed", "#fab1c5"];

  topFishTypes.forEach((fishType, index) => {
    const button = document.createElement("button");
    button.innerText = fishType;
    button.className = "button";
    button.addEventListener("click", () => {
      setBackgroundImage(`images/${fishType}.png`);
      updateRadarChart(data, fishType, buttonColors, topFishTypes);
    });

    // Assign a color from the array to the button
    button.style.backgroundColor = buttonColors[index % buttonColors.length];

    button.style.transition = "background-color 1s ease-in-out";

    button.addEventListener("mouseover", () => {
      const originalColor = buttonColors[index % buttonColors.length];
      const hoverColor = `${originalColor}90`;
      button.style.backgroundColor = hoverColor;
    });

    button.addEventListener("mouseout", () => {
      const originalColor = buttonColors[index % buttonColors.length];
      button.style.backgroundColor = originalColor;
    });

    document.getElementById("buttonContainer").appendChild(button);
  });

  // Initial render for the first fish type
  updateRadarChart(data, topFishTypes[0], buttonColors, topFishTypes);
});


// Function to update the radar chart
function updateRadarChart(data, fishType, buttonColors, topFishTypes) {
    // Filter data for the selected fish type
    const fishTypeData = data.filter(d => d.fish_type === fishType);
    
    // Load the image for the current fish type
    const fishTypeImage = new Image();
    fishTypeImage.src = `images/${fishType}.png`; // Adjust the file extension and path as needed
  
    fishTypeImage.onload = function () {
      // Set the background image properties
      setBackgroundImage(`images/${fishType}.png`);
    };

    // Flavor columns
    const flavors = ["smoked", "grilled", "citrus", "garlic", "chili_pepper", "tomato", "dairy"];

    // Count occurrences of 'Yes' for each flavor
    const flavorCounts = flavors.map(flavor => {
      return {
        flavor: flavor,
        count: fishTypeData.filter(d => d[flavor] === "Yes").length
      };
    });
  
    // Set the dimensions for the radar chart
    const svgWidth = 1000, svgHeight = 800;
    const margin = { top: 50, right: 50, bottom: 40, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
  
    // Select or Create SVG container for the radar chart
    let svg = d3.select("#app4").select("svg");
    if (svg.empty()) {
    svg = d3.select("#app4")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`)
    }
  
    // Create the radial scale
    const radius = Math.min(width, height) / 2;
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, d3.max(flavorCounts, d => d.count)]);
  
    // Calculate the angle for each axis
    const angleSlice = Math.PI * 2 / flavors.length;
  
    // Function to compute the line path
    const line = d3.lineRadial()
      .angle((d, i) => i * angleSlice)
      .radius(d => d[0]);
  
    // Data for the radar chart
    const radarData = flavorCounts.map(d => [rScale(d.count), d.flavor]);
  
    // Update or Append the radar path
    let radarPath = svg.selectAll("path").data([radarData]);
    radarPath.enter()
      .append("path")
      .merge(radarPath)
      .transition() // Apply transition
      .duration(1000) // Duration in milliseconds
      .attr("d", line)
      .style("fill", () => {
        const strokeColor = buttonColors[topFishTypes.indexOf(fishType) % buttonColors.length];
        return `${strokeColor}60`; // Reduced opacity
      })
      .style("stroke", () => buttonColors[topFishTypes.indexOf(fishType) % buttonColors.length])
      .style("stroke-width", "7px")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");
  
    radarPath.exit().remove();
  
    // Add labels
    // Create the axes
    const axis = svg.selectAll(".axis")
      .data(flavors)
      .enter()
      .append("g")
      .attr("class", "axis")
      .style('text-transform', 'capitalize');
  
    // Append the lines with tooltips and store flavorCounts as a data attribute
    const lines = axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(d3.max(flavorCounts, d => d.count)) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(d3.max(flavorCounts, d => d.count)) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "#737373")
      .style("stroke-width", "2px")
      .attr("stroke-linejoin", "round") // Add rounded corners to the path
      .attr("stroke-linecap", "round") // Add rounded corners to the path)
  
    axis.append("text")
      .attr("class", "legend4")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(d3.max(flavorCounts, d => d.count) * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(d3.max(flavorCounts, d => d.count) * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d);
  }
