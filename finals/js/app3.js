// Import D3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Dataset URL
const datasetURL = "data/fish_data.csv";

// Create tooltip div
const tooltip = d3.select("#app3")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "10px")
  .style("pointer-events", "none");

  d3.csv(datasetURL).then(data => {
    console.log("Loaded data:", data);
    // Ensure each data point is correctly formatted, including the fishType
    data.forEach(d => {
      d.rtg = +d.rtg; // Convert rating to number
      // Assuming 'name' and 'fishType' are already in the correct format
    });
  
    // Calculate the count for each brand
    const brandCounts = d3.rollups(data, v => v.length, d => d.brand)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  
    // Filter to only include the top 10 brands
    const topBrands = brandCounts.slice(0, 10).map(d => d.brand);
  
    // Filter the data to include only the top 10 brands
    const filteredData = data.filter(d => topBrands.includes(d.brand));
  
    // Group the filtered data by brand
    const brandData = d3.group(filteredData, d => d.brand);
  
    // Calculate statistics for box plot including product names for outliers
    const boxPlotData = Array.from(brandData, ([brand, values]) => {
        const rtgs = values.map(d => d.rtg).sort(d3.ascending);
        const q1 = d3.quantileSorted(rtgs, 0.25);
        const median = d3.quantileSorted(rtgs, 0.5);
        const q3 = d3.quantileSorted(rtgs, 0.75);
        const iqr = q3 - q1;
        const min = q1 - 1.5 * iqr; // Ensure min is defined here
        const max = q3 + 1.5 * iqr; // Ensure max is defined here
      
        // Calculate outliers using the defined min and max
        const outliers = values.filter(d => d.rtg < min || d.rtg > max)
                               .map(d => ({ rtg: d.rtg, name: d.name, fishType: d.fish_type}));
      
        return { brand, q1, median, q3, min, max, outliers };
      });

  // Dimensions for the plot
  const width = 900;
  const height = 600;
  const margin = { top: 50, right: 20, bottom: 600, left: 100 };

  // Create SVG container
  const svg = d3.select("#app3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3.scaleBand()
    .domain(topBrands)
    .range([0, width])
    .padding(0.1);

    // Calculate the maximum rating including outliers
    const maxRatingIncludingOutliers = d3.max(boxPlotData, d => {
        const maxRtg = d3.max([d.q1, d.median, d.q3]);
        const maxOutlierRtg = d.outliers.length > 0 ? d3.max(d.outliers, o => o.rtg) : 0;
        return Math.max(maxRtg, maxOutlierRtg);
    });
    
    // Update the yScale domain
    const yScale = d3.scaleLinear()
        .domain([0, maxRatingIncludingOutliers])
        .range([height, 0]);

  // Axes
  svg.append("g")
    .call(d3.axisLeft(yScale).tickSize(0).tickFormat(d3.format("d")))
    .selectAll("text")
    .attr("x", -10)
    .style("text-anchor", "end")
    .style('font-family', 'monotalic-narrow, sans-serif')
    .style("font-size", "21px");

  const brandToCountMap = new Map(brandCounts.map(d => [d.brand, d.count]));

  // X-Axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickFormat(d => `${d} (${brandToCountMap.get(d)})`))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .attr("dy", "1.5em")
    .style('font-family', 'monotalic-narrow, sans-serif')
    .style("font-size", "21px");

  // Create group elements for each brand
  const brandGroups = svg.selectAll(".brand-group")
    .data(boxPlotData)
    .enter().append("g")
    .attr("class", "brand-group")
    .attr("transform", d => `translate(${xScale(d.brand)}, 0)`);

  // Box plot rectangles
    brandGroups.append("rect")
    .attr("class", "box")
    .attr("y", d => yScale(d.q3))
    .attr("width", xScale.bandwidth())
    .attr("height", d => yScale(d.q1) - yScale(d.q3))
    .attr("fill", "#bbedff")
    .on("mouseover", (event, d) => {
    tooltip
        .attr("class", "boxtooltip") // Assign the boxtooltip class here
        .transition()
        .duration(200)
        .style("opacity", 0.9);

    // Calculate position relative to the mouse cursor
    const xOffset = -50; // Horizontal offset from the mouse cursor
    const yOffset = -50; // Vertical offset from the mouse cursor
    const left = event.pageX + xOffset;
    const top = event.pageY + yOffset;

    tooltip.html(`Q1: $${d.q1}<br>Q3: $${d.q3}`)
        .style("left", `${left}px`)
        .style("top", `${top}px`);
    })
    .on("mouseout", () => {
    tooltip.transition().duration(500).style("opacity", 0);
    });

    // Median lines
    brandGroups.append("line")
    .attr("class", "median")
    .attr("x1", 0)
    .attr("x2", xScale.bandwidth())
    .attr("y1", d => yScale(d.median))
    .attr("y2", d => yScale(d.median))
    .attr("stroke", "#0091ed")
    .attr("stroke-width", 5)
    .on("mouseover", (event, d) => {
    tooltip
        .attr("class", "boxtooltip") // Assign the boxtooltip class here
        .transition()
        .duration(200)
        .style("opacity", 0.9);

    // Calculate position relative to the mouse cursor
    const xOffset = -50; // Horizontal offset from the mouse cursor
    const yOffset = -30; // Vertical offset from the mouse cursor
    const left = event.pageX + xOffset;
    const top = event.pageY + yOffset;

    tooltip.html(`Median: $${d.median}`)
        .style("left", `${left}px`)
        .style("top", `${top}px`);
    })
    .on("mouseout", () => {
    tooltip.transition().duration(500).style("opacity", 0);
    });

    // Outliers
    // Create the tooltip div first
    const tooltip = d3.select("#app3")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip3")
    .style("position", "absolute")
    .style("pointer-events", "none");

    // Then define the event handlers
    const mouseover = function (event, d) {
    tooltip.style("opacity", 1);
    };

    const mousemove = function (event, d) {
    const imageName = `${d.fishType.toLowerCase()}.png`;

    const tooltipContent = `
    <div class="tooltip-content">
        <div class="tooltip3-image">
        <img src="images/${imageName}" alt="${d.fishType} Image">
        </div>
        <div class="tooltip3-text">
        $${d.rtg}<br>
        ${d.name}
        </div>
    </div>
    `;
    const xOffset = -100; // Horizontal offset from the mouse cursor
    const yOffset = -10; // Vertical offset from the mouse cursor
  
    tooltip.html(tooltipContent)
      .style("left", `${event.pageX + xOffset}px`)
      .style("top", `${event.pageY + yOffset}px`);
    };

    const mouseleave = function (event, d) {
    tooltip.style("opacity", 0);
    };

    // Now attach these handlers to your outliers
    brandGroups.selectAll(".outlier")
    .data(d => d.outliers)
    .enter().append("circle")
    .attr("class", "outlier")
    .attr("cx", xScale.bandwidth() / 2)
    .attr("cy", outlier => yScale(outlier.rtg))
    .attr("r", 7)
    .attr("fill", "#dd61ab")
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseleave);


  // Sorting function
function updateChart(sortBy) {
    // Sorting logic
    if (sortBy === 'median') {
      boxPlotData.sort((a, b) => d3.ascending(a.median, b.median));
    } else { // default sorting
      boxPlotData.sort((a, b) => brandToCountMap.get(b.brand) - brandToCountMap.get(a.brand));
    }
  
    // Update xScale domain
    xScale.domain(boxPlotData.map(d => d.brand));
  
    // Transition the brand groups
    svg.selectAll(".brand-group")
      .transition()
      .duration(1000)
      .attr("transform", d => `translate(${xScale(d.brand)}, 0)`);
  
    // Update the x-axis
    svg.select(".x-axis")
      .transition()
      .duration(1000)
      .call(d3.axisBottom(xScale).tickSize(0).tickFormat(d => `${d} (${brandToCountMap.get(d)})`));
  }
  
  // Attach event listeners to the buttons
  d3.select("#buttonSortByMedian").on("click", () => updateChart('median'));
  d3.select("#buttonSortByDefault").on("click", () => updateChart('default'));
});

// JavaScript to toggle the active class on button click
const buttons = document.querySelectorAll("#buttonContainer3 button");

buttons.forEach((button) => {
    button.addEventListener("click", () => {
        // Remove the "active" class from all buttons
        buttons.forEach((btn) => btn.classList.remove("active"));

        // Add the "active" class to the clicked button
        button.classList.add("active");
    });
});