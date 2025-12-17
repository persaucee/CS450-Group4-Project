import * as d3 from "d3";
import React, { Component } from "react";

const CITIES = [
  "Amsterdam", "Athens", "Barcelona", "Berlin", "Budapest",
  "Lisbon", "London", "Paris", "Rome", "Vienna"
];

class PriceDistanceScatter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: true,
      selectedCity: "Amsterdam",
      isWeekend: false
    };
    this.svgRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedCity !== this.state.selectedCity || prevState.isWeekend !== this.state.isWeekend) {
      this.loadData();
    }
  }

  loadData() {
    this.setState({ loading: true });
    const { selectedCity, isWeekend } = this.state;
    const fileName = `${selectedCity.toLowerCase()}_${isWeekend ? 'weekends' : 'weekdays'}.csv`;
    const csvPath = process.env.PUBLIC_URL + "/data/" + fileName;
    d3.csv(csvPath)
      .then((rawRows) => {
        const parsedData = rawRows
          .map((d) => ({
            price: parseFloat(d.realSum),
            dist: parseFloat(d.dist),
          }))
          .filter((d) => !isNaN(d.price) && d.price > 0 && !isNaN(d.dist) && d.dist <= 7);

        // Binning Logic
        const binSize = 0.5;
        const binnedMap = d3.rollup(
          parsedData,
          (v) => d3.mean(v, (d) => d.price),
          (d) => Math.floor(d.dist / binSize) * binSize
        );

        const binnedData = Array.from(binnedMap, ([dist, avgPrice]) => ({
          dist,
          avgPrice,
        })).sort((a, b) => a.dist - b.dist);

        this.setState({ data: binnedData, loading: false });
        this.drawChart(binnedData);
      })
      .catch((err) => {
        console.error("Could not load file:", fileName, err);
        this.setState({ loading: false, data: [] });
        if (this.svgRef.current) {
          d3.select(this.svgRef.current).selectAll("*").remove();
        }
      });
  }

  drawChart(data) {
    const svg = d3.select(this.svgRef.current);
    const width = 900;
    const height = 500;
    const margin = { left: 70, right: 20, top: 20, bottom: 60 }; 
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("overflow", "visible");

    svg.selectAll("*").remove();

    if (data.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#666")
        .text("No data found.");
      return;
    }

    const innerChart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.select(".chart-tooltip").remove();
    const tooltip = d3.select("body").append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("display", "none")
      .style("z-index", "1000");

    const xScale = d3.scaleLinear().domain([0, 7]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.avgPrice) * 1.1]).range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => "€" + d3.format("~s")(d));

    innerChart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .style("font-size", "14px");

    innerChart.append("g")
      .call(yAxis)
      .style("font-size", "14px");

    innerChart.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#555")
      .text("Distance from City Center (km)");

    innerChart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#555")
      .text("Average Price (EUR)");

    const lineGenerator = d3.line()
      .x(d => xScale(d.dist))
      .y(d => yScale(d.avgPrice))
      .curve(d3.curveCardinal);

    innerChart.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 4)
      .attr("d", lineGenerator);

    innerChart.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => xScale(d.dist))
      .attr("cy", d => yScale(d.avgPrice))
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block").html(`
          <strong>Dist:</strong> ${d.dist}-${d.dist + 0.5}km<br/>
          <strong>Price:</strong> €${Math.round(d.avgPrice)}
        `);
        d3.select(event.currentTarget).attr("fill", "#007bff");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 15) + "px");
      })
      .on("mouseout", (event) => {
        tooltip.style("display", "none");
        d3.select(event.currentTarget).attr("fill", "white");
      });
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", gap: "10px" }}>
          <select 
            value={this.state.selectedCity}
            onChange={(e) => this.setState({ selectedCity: e.target.value })}
            style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ display: "flex", background: "#eee", borderRadius: "4px", padding: "2px" }}>
            <button 
              onClick={() => this.setState({ isWeekend: false })}
              style={{ 
                border: "none", background: !this.state.isWeekend ? "white" : "transparent",
                padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: !this.state.isWeekend ? "bold" : "normal"
              }}
            >
              Weekdays
            </button>
            <button 
              onClick={() => this.setState({ isWeekend: true })}
              style={{ 
                border: "none", background: this.state.isWeekend ? "white" : "transparent",
                padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: this.state.isWeekend ? "bold" : "normal"
              }}
            >
              Weekends
            </button>
          </div>
        </div>

 
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {this.state.loading && <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#888"}}>Loading...</div>}
          <svg ref={this.svgRef} style={{ width: "100%", height: "100%" }}></svg>
        </div>
      </div>
    );
  }
}

export default PriceDistanceScatter;