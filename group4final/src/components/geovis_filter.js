// geovis_filter.js 
// load the data of all file and categorize follow countries
// use the data to create a geovis filter
// the geovis filter should be a dropdown menu that allows the user to select a country
// the geovis filter should be a dropdown menu that allows the user to select a country 

import React, { Component } from 'react';
import * as d3 from 'd3';

// Import world.json directly from src/data
import worldJson from '../data/world.json';

// Import all CSV files from src/data
import amsterdamWeekdays from '../data/amsterdam_weekdays.csv';
import amsterdamWeekends from '../data/amsterdam_weekends.csv';
import athensWeekdays from '../data/athens_weekdays.csv';
import athensWeekends from '../data/athens_weekends.csv';
import barcelonaWeekdays from '../data/barcelona_weekdays.csv';
import barcelonaWeekends from '../data/barcelona_weekends.csv';
import berlinWeekdays from '../data/berlin_weekdays.csv';
import berlinWeekends from '../data/berlin_weekends.csv';
import budapestWeekdays from '../data/budapest_weekdays.csv';
import budapestWeekends from '../data/budapest_weekends.csv';
import lisbonWeekdays from '../data/lisbon_weekdays.csv';
import lisbonWeekends from '../data/lisbon_weekends.csv';
import londonWeekdays from '../data/london_weekdays.csv';
import londonWeekends from '../data/london_weekends.csv';
import parisWeekdays from '../data/paris_weekdays.csv';
import parisWeekends from '../data/paris_weekends.csv';
import romeWeekdays from '../data/rome_weekdays.csv';
import romeWeekends from '../data/rome_weekends.csv';
import viennaWeekdays from '../data/vienna_weekdays.csv';
import viennaWeekends from '../data/vienna_weekends.csv';

// Map of CSV file names to their imported URLs
const CSV_FILES = {
  "amsterdam_weekdays.csv": amsterdamWeekdays,
  "amsterdam_weekends.csv": amsterdamWeekends,
  "athens_weekdays.csv": athensWeekdays,
  "athens_weekends.csv": athensWeekends,
  "barcelona_weekdays.csv": barcelonaWeekdays,
  "barcelona_weekends.csv": barcelonaWeekends,
  "berlin_weekdays.csv": berlinWeekdays,
  "berlin_weekends.csv": berlinWeekends,
  "budapest_weekdays.csv": budapestWeekdays,
  "budapest_weekends.csv": budapestWeekends,
  "lisbon_weekdays.csv": lisbonWeekdays,
  "lisbon_weekends.csv": lisbonWeekends,
  "london_weekdays.csv": londonWeekdays,
  "london_weekends.csv": londonWeekends,
  "paris_weekdays.csv": parisWeekdays,
  "paris_weekends.csv": parisWeekends,
  "rome_weekdays.csv": romeWeekdays,
  "rome_weekends.csv": romeWeekends,
  "vienna_weekdays.csv": viennaWeekdays,
  "vienna_weekends.csv": viennaWeekends,
};

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

    const mysvg = d3.select("#map")
      .selectAll("svg")
      .data([null])
      .join("svg")
      .attr("width", "100%")
      .attr("height", 660)
      .attr("viewBox", "0 0 1230 660")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const myg = mysvg.selectAll(".myg")
      .data([null])
      .join("g")
      .attr("class", "myg");

    const myzoom = d3.zoom()
      .scaleExtent([1, 5])
      .on("zoom", (event) => {
        myg.attr("transform", event.transform);
      });

    mysvg.call(myzoom);

    const myprojection = d3.geoEqualEarth()
      .fitSize([1230, 660], world);
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
          .style("left", (event.clientX + 15) + "px")
          .style("top", (event.clientY + 15) + "px")
          .html(`${d.properties.name}${cityName ? ` (${cityName})` : ''}<br/>${metricConfig.label}: ${metricConfig.format(value)}`);
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select("#map-tooltip");
        tooltip
          .style("left", (event.clientX + 15) + "px")
          .style("top", (event.clientY + 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 1);
        d3.select("#map-tooltip").style("opacity", 0);
      });

    // Create legend with 6 parts
    const legendData = d3.ticks(minDomain, maxDomain, 6);
    mysvg.selectAll(".legend-rect")
      .data(legendData)
      .join("rect")
      .attr("class", "legend-rect")
      .attr("x", (d, i) => 20 + i * 40)
      .attr("y", 30)
      .attr("width", 40)
      .attr("height", 20)
      .attr("fill", d => colorScale(d))
      .attr("stroke", "grey");

    mysvg.selectAll(".legend-text")
      .data(legendData)
      .join("text")
      .attr("class", "legend-text")
      .attr("x", (d, i) => 40 + i * 40)
      .attr("fill", "black")
      .attr("y", 25)
      .text(d => {
        if (selectedMetric === 'cost') {
          return `$${Math.round(d)}`;
        } else if (selectedMetric === 'family') {
          return `${Math.round(d)}`;
        } else { // dist
          return `${d.toFixed(1)}`;
        }
      })
      .attr("text-anchor", "middle");
  }

  async loadAllData() {
    const allRows = [];

    // Use imported world.json from src/data
    let worldData = JSON.parse(JSON.stringify(worldJson)); // Deep clone to avoid mutating import

    // Filter to only keep countries that exist in cityToCountryMap
    const countryNames = Object.values(cityToCountryMap);
    worldData.features = worldData.features.filter(feature => 
      countryNames.includes(feature.properties.name)
    );

    // Load all CSV files from src/data (using imported URLs)
    for (const [file, url] of Object.entries(CSV_FILES)) {
      try {
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
      <div className="container" style={{ marginLeft: "20px", marginRight: "20px" }}>
        <h1>Airbnb Visualization</h1>
        <div style={{ marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div>
            <label htmlFor="metric-select" style={{ marginRight: "10px", fontSize: "16px", fontWeight: "bold" }}>
              Select Metric:
            </label>
            <select
              id="metric-select"
              value={this.state.selectedMetric}
              onChange={this.handleMetricChange}
              style={{
                padding: "8px 12px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
                minWidth: "250px"
              }}
            >
              {Object.keys(METRICS).map(key => (
                <option key={key} value={key}>
                  {METRICS[key].label} - {METRICS[key].description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-select" style={{ marginRight: "10px", fontSize: "16px", fontWeight: "bold" }}>
              Sort Order:
            </label>
            <select
              id="sort-select"
              value={this.state.sortOrder}
              onChange={this.handleSortOrderChange}
              style={{
                padding: "8px 12px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
                minWidth: "150px"
              }}
            >
              <option value="asc">Ascending (Low to High)</option>
              <option value="desc">Descending (High to Low)</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "20px", marginLeft: "20px", marginRight: "20px", boxSizing: "border-box" }}>
          <div className="map-container" style={{ 
            flex: "2 0 0",
            height: "660px",
            position: "relative",
            minWidth: 0
          }}>
            <div id="map" style={{ width: "100%", height: "660px" }}></div>
            <div 
              id="map-tooltip"
              style={{
                position: "fixed",
                padding: "8px 12px",
                background: "rgba(0, 0, 0, 0.8)",
                color: "white",
                borderRadius: "4px",
                pointerEvents: "none",
                opacity: 0,
                fontSize: "14px",
                zIndex: 1000
              }}
            ></div>
          </div>
          <div style={{ 
            flex: "1 0 0",
            height: "660px",
            border: "1px solid #ccc", 
            borderRadius: "4px",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            overflowY: "auto",
            minWidth: 0
          }}>
            <h2 style={{ marginTop: "0", marginBottom: "15px", fontSize: "18px" }}>
              Sorted List ({metricConfig.label})
            </h2>
            <ol style={{ paddingLeft: "20px", margin: "0" }}>
              {sortedList.map((item, index) => (
                <li 
                  key={item.city} 
                  style={{ 
                    marginBottom: "10px",
                    padding: "8px",
                    backgroundColor: index < 3 ? "#e3f2fd" : "transparent",
                    borderRadius: "4px"
                  }}
                >
                  <strong>{item.city}</strong> ({item.country})
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                    {metricConfig.label}: {metricConfig.format(item.value)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

export default GeovisFilter;
