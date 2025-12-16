// geovis_filter.js 
// load the data of all file and categorize follow countries
// use the data to create a geovis filter
// the geovis filter should be a dropdown menu that allows the user to select a country
// the geovis filter should be a dropdown menu that allows the user to select a country 

import * as d3 from 'd3';
import { Component } from 'react';

// All CSV files we want to load from the data folder.
// If you add new CSVs, put their file names into this list.
const CSV_FILES = [
  "amsterdam_weekdays.csv",
  "amsterdam_weekends.csv",
  "athens_weekdays.csv",
  "athens_weekends.csv",
  "barcelona_weekdays.csv",
  "barcelona_weekends.csv",
  "berlin_weekdays.csv",
  "berlin_weekends.csv",
  "budapest_weekdays.csv",
  "budapest_weekends.csv",
  "lisbon_weekdays.csv",
  "lisbon_weekends.csv",
  "london_weekdays.csv",
  "london_weekends.csv",
  "paris_weekdays.csv",
  "paris_weekends.csv",
  "rome_weekdays.csv",
  "rome_weekends.csv",
  "vienna_weekdays.csv",
  "vienna_weekends.csv",
];

// Convert "amsterdam_weekdays.csv" -> "Amsterdam"
function fileNameToCountry(fileName) {
  const base = fileName.split("_")[0];
  if (!base) return "Unknown";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Map city names to country names in world.json
const cityToCountryMap = {
  "Amsterdam": "Netherlands",
  "Athens": "Greece",
  "Barcelona": "Spain",
  "Berlin": "Germany",
  "Budapest": "Hungary",
  "Lisbon": "Portugal",
  "London": "United Kingdom",
  "Paris": "France",
  "Rome": "Italy",
  "Vienna": "Austria"
};

// Available metrics for visualization
const METRICS = {
  cost: {
    label: "Cost of Living",
    description: "Average price per night",
    format: (value) => `$${value.toFixed(2)}`,
    colorRange: ["white", "darkblue"]
  },
  family: {
    label: "Family-Friendly",
    description: "Percentage of entire home/apt listings",
    format: (value) => `${value.toFixed(1)}`,
    colorRange: ["white", "darkgreen"]
  },
  dist: {
    label: "Distance to City Center",
    description: "Median distance to city center (km)",
    format: (value) => `${value.toFixed(2)}`,
    colorRange: ["white", "darkred"]
  }
};

class GeovisFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      metricsByCountry: {
        cost: {},
        family: {},
        dist: {}
      },
      GeoJsonData: null,
      selectedMetric: 'cost',
      sortOrder: 'asc'
    };
  }

  componentDidMount() {
    this.loadAllData();
  }

  drawWorldMap = (world, metricsByCountry, selectedMetric) => {
    const metricConfig = METRICS[selectedMetric];
    const countryMetrics = metricsByCountry[selectedMetric] || {};
    
    // Calculate metric value per country
    world.features.forEach(country => {
      // Find the city that corresponds to this country
      const cityName = Object.keys(cityToCountryMap).find(
        city => cityToCountryMap[city] === country.properties.name
      );
      country.properties.metricValue = cityName ? (countryMetrics[cityName] || 0) : 0;
      country.properties.cityName = cityName || "";
    });

    d3.select("#map").selectAll("*").remove();

    // Use viewBox for responsive SVG - larger view for better visibility
    const viewBoxWidth = 700;
    const viewBoxHeight = 380;

    const mysvg = d3.select("#map")
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const myg = mysvg.selectAll(".myg")
      .data([null])
      .join("g")
      .attr("class", "myg");

    // Set initial zoom level to 1.3x for bigger default view
    const initialScale = 1.3;
    const initialTransform = d3.zoomIdentity
      .translate(viewBoxWidth * (1 - initialScale) / 2, viewBoxHeight * (1 - initialScale) / 2)
      .scale(initialScale);

    const myzoom = d3.zoom()
      .scaleExtent([1, 5])
      .on("zoom", (event) => {
        myg.attr("transform", event.transform);
      });

    mysvg.call(myzoom);
    mysvg.call(myzoom.transform, initialTransform);

    const myprojection = d3.geoEqualEarth()
      .fitSize([viewBoxWidth, viewBoxHeight - 60], world);
    const pathGenerator = d3.geoPath().projection(myprojection);

    // Calculate domain based on metric type
    const allValues = world.features.map(d => d.properties.metricValue || 0).filter(v => v > 0);
    const maxValue = d3.max(allValues) || 1;
    const minValue = d3.min(allValues) || 0;

    
    // Set appropriate min domain based on metric
    let minDomain, maxDomain;
    if (selectedMetric === 'cost') {
      minDomain = minValue;
      maxDomain = Math.max(maxValue, minDomain);
    } else if (selectedMetric === 'family') {
      minDomain = 0;
      maxDomain = 100;
    } else { // dist
      minDomain = minValue;
      maxDomain = Math.max(maxValue, minDomain);
    }
    
    const colorScale = d3.scaleSequential()
      .domain([minDomain, maxDomain])
      .interpolator(d3.interpolateRgb(...metricConfig.colorRange));

    myg.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", d => pathGenerator(d))
      .attr("fill", d => {
        const value = d.properties.metricValue || 0;
        const clampedValue = Math.max(minDomain, Math.min(value, maxDomain));
        return colorScale(clampedValue);
      })
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 3);
        const tooltip = d3.select("#map-tooltip");
        const cityName = d.properties.cityName;
        const value = d.properties.metricValue || 0;
        tooltip
          .style("opacity", 1)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .html(`${d.properties.name}${cityName ? ` (${cityName})` : ''}<br/>${metricConfig.label}: ${metricConfig.format(value)}`);
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select("#map-tooltip");
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 1);
        d3.select("#map-tooltip").style("opacity", 0);
      });

    // Create legend with 5 blocks - positioned at bottom right
    const legendData = d3.ticks(minDomain, maxDomain, 5);
    const blockWidth = 35;
    const blockHeight = 18;
    const legendX = viewBoxWidth - (legendData.length * blockWidth) - 20;
    const legendY = viewBoxHeight - 45;

    mysvg.selectAll(".legend-rect")
      .data(legendData)
      .join("rect")
      .attr("class", "legend-rect")
      .attr("x", (d, i) => legendX + i * blockWidth)
      .attr("y", legendY)
      .attr("width", blockWidth)
      .attr("height", blockHeight)
      .attr("fill", d => colorScale(d))
      .attr("stroke", "#666");

    mysvg.selectAll(".legend-text")
      .data(legendData)
      .join("text")
      .attr("class", "legend-text")
      .attr("x", (d, i) => legendX + i * blockWidth + blockWidth / 2)
      .attr("fill", "#333")
      .attr("y", legendY - 5)
      .attr("font-size", "10px")
      .text(d => {
        if (selectedMetric === 'cost') {
          return `$${Math.round(d)}`;
        } else if (selectedMetric === 'family') {
          return `${Math.round(d)}%`;
        } else { // dist
          return `${d.toFixed(1)}`;
        }
      })
      .attr("text-anchor", "middle");
  }

  async loadAllData() {
    const allRows = [];

    // Load world.json from public/data folder (served at /data/ in React)
    let worldData;
    try {
      worldData = await d3.json(process.env.PUBLIC_URL + "/data/world.json");
    } catch (e) {
      console.error("Failed to load world.json", e);
      return;
    }

    // Filter to only keep countries that exist in cityToCountryMap
    const countryNames = Object.values(cityToCountryMap);
    worldData.features = worldData.features.filter(feature => 
      countryNames.includes(feature.properties.name)
    );

    for (const file of CSV_FILES) {
      try {
        // Load from public/data folder (served at /data/ in React)
        const url = process.env.PUBLIC_URL + `/data/${file}`;
        const rows = await d3.csv(url);

        const country = fileNameToCountry(file);
        const augmentedRows = rows.map((row) => {
          const realSumValue = parseFloat(row.realSum);
          const parsedRealSum = isNaN(realSumValue) ? 0 : realSumValue;
          
          return {
            ...row,
            country,
            sourceFile: file,
            realSum: parsedRealSum,
          };
        });
        allRows.push(...augmentedRows);
      } catch (error) {
        // Keep going even if one file fails
        // eslint-disable-next-line no-console
        console.error(`Failed to load CSV file "${file}"`, error);
      }
    }

    // Group all rows by country
    const grouped = allRows.reduce((acc, row) => {
      if (!acc[row.country]) {
        acc[row.country] = [];
      }
      acc[row.country].push(row);
      return acc;
    }, {});

    // Get all countries
    const allCountries = Object.keys(grouped).sort();
    
    // Calculate all metrics by country
    const metricsByCountry = {
      cost: {},
      family: {},
      dist: {}
    };
    
    // Helper function to calculate median
    const calculateMedian = (arr) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
    };
    
    allCountries.forEach(country => {
      const rows = grouped[country];
      
      // Calculate cost: average realSum
      const realSums = rows
        .map(row => {
          const value = typeof row.realSum === 'number' ? row.realSum : parseFloat(row.realSum);
          return value;
        })
        .filter(price => !isNaN(price) && price > 0);
      if (realSums.length > 0) {
        metricsByCountry.cost[country] = realSums.reduce((sum, price) => sum + price, 0) / realSums.length;
      } else {
        metricsByCountry.cost[country] = 0;
      }
      
      // Calculate family: percentage of "Entire home/apt" listings
      const totalListings = rows.length;
      const entireHomeListings = rows.filter(row => 
        row.room_type && row.room_type.toLowerCase().includes('entire')
      ).length;
      metricsByCountry.family[country] = totalListings > 0 
        ? (entireHomeListings / totalListings) * 100 
        : 0;
      
      // Calculate dist: median distance to city center
      const distances = rows
        .map(row => {
          const value = parseFloat(row.dist);
          return value;
        })
        .filter(dist => !isNaN(dist) && dist > 0);
      if (distances.length > 0) {
        metricsByCountry.dist[country] = calculateMedian(distances);
      } else {
        metricsByCountry.dist[country] = 0;
      }
    });
    
    console.log("metrics by country:", metricsByCountry);
    
    this.setState({
      metricsByCountry: metricsByCountry,
      GeoJsonData: worldData,
    }, () => {
      // Draw map after data is loaded
      if (worldData && Object.keys(metricsByCountry.cost).length > 0) {
        this.drawWorldMap(worldData, metricsByCountry, this.state.selectedMetric);
      }
    });
  }

  handleMetricChange = (event) => {
    const newMetric = event.target.value;
    this.setState({ selectedMetric: newMetric }, () => {
      if (this.state.GeoJsonData && Object.keys(this.state.metricsByCountry).length > 0) {
        this.drawWorldMap(this.state.GeoJsonData, this.state.metricsByCountry, newMetric);
      }
    });
  }

  handleSortOrderChange = (event) => {
    this.setState({ sortOrder: event.target.value });
  }

  getSortedList = () => {
    const { metricsByCountry, selectedMetric, sortOrder } = this.state;
    const countryMetrics = metricsByCountry[selectedMetric] || {};
    
    // Create array of cities with their metric values
    const cityList = Object.keys(cityToCountryMap).map(city => ({
      city,
      country: cityToCountryMap[city],
      value: countryMetrics[city] || 0
    }));
    
    // Sort based on sort order
    const sorted = [...cityList].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.value - b.value;
      } else {
        return b.value - a.value;
      }
    });
    
    return sorted;
  }

  componentDidUpdate(prevProps, prevState) {
    // Redraw map when metric changes
    if (prevState.selectedMetric !== this.state.selectedMetric && 
        this.state.GeoJsonData && 
        Object.keys(this.state.metricsByCountry).length > 0) {
      this.drawWorldMap(this.state.GeoJsonData, this.state.metricsByCountry, this.state.selectedMetric);
    }
  }

  render() {
    const sortedList = this.getSortedList();
    const metricConfig = METRICS[this.state.selectedMetric];
    
    return (
      <div className="geovis-container" style={{ width: "100%", height: "100%" }}>
        {/* Controls Row */}
        <div style={{ 
          marginBottom: "10px", 
          display: "flex", 
          gap: "15px", 
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <label htmlFor="metric-select" style={{ fontSize: "12px", fontWeight: "bold" }}>
              Metric:
            </label>
            <select
              id="metric-select"
              value={this.state.selectedMetric}
              onChange={this.handleMetricChange}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer"
              }}
            >
              {Object.keys(METRICS).map(key => (
                <option key={key} value={key}>
                  {METRICS[key].label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <label htmlFor="sort-select" style={{ fontSize: "12px", fontWeight: "bold" }}>
              Sort:
            </label>
            <select
              id="sort-select"
              value={this.state.sortOrder}
              onChange={this.handleSortOrderChange}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer"
              }}
            >
              <option value="asc">Low → High</option>
              <option value="desc">High → Low</option>
            </select>
          </div>
        </div>

        {/* Sorted List - Horizontal at top */}
        <div style={{ 
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "8px 0",
          marginBottom: "10px",
          borderBottom: "1px solid #eee"
        }}>
          {sortedList.map((item, index) => (
            <div 
              key={item.city} 
              style={{ 
                flex: "0 0 auto",
                padding: "6px 10px",
                backgroundColor: index === 0 ? "#4CAF50" : index === 1 ? "#8BC34A" : index === 2 ? "#CDDC39" : "#f5f5f5",
                color: index < 2 ? "white" : "#333",
                borderRadius: "4px",
                fontSize: "11px",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              <strong>#{index + 1} {item.city}</strong>
              <span style={{ marginLeft: "5px", opacity: 0.9 }}>
                {metricConfig.format(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Map - Full Width */}
        <div className="map-container" style={{ 
          width: "100%",
          height: "calc(100% - 100px)",
          minHeight: "350px",
          position: "relative"
        }}>
          <div id="map" style={{ width: "100%", height: "100%" }}></div>
          <div 
            id="map-tooltip"
            style={{
              position: "fixed",
              padding: "8px 12px",
              background: "rgba(0, 0, 0, 0.85)",
              color: "white",
              borderRadius: "4px",
              pointerEvents: "none",
              opacity: 0,
              fontSize: "12px",
              zIndex: 1000,
              maxWidth: "200px"
            }}
          ></div>
        </div>
      </div>
    );
  }
}

export default GeovisFilter;
