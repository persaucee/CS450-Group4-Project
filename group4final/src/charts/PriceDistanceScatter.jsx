import * as d3 from "d3";
import React, { Component, useState } from "react";


const CITIES = [
  "Amsterdam",
  "Athens",
  "Barcelona",
  "Berlin",
  "Budapest",
  "Lisbon",
  "London",
  "Paris",
  "Rome",
  "Vienna"
];


class PriceDistanceLine extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loading: true
    };
    this.svgRef = React.createRef();
  }

  componentDidMount() {
    this.loadData(this.props.fileName);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fileName !== this.props.fileName) {
      this.loadData(this.props.fileName);
    }
  }

  loadData(fileName) {
    this.setState({ loading: true });
    const csvPath = process.env.PUBLIC_URL + "/data/" + fileName;

    d3.csv(csvPath)
      .then((rawRows) => {
        const parsedData = rawRows
          .map((d) => ({
            price: parseFloat(d.realSum),
            dist: parseFloat(d.dist),
          }))
          .filter((d) => !isNaN(d.price) && d.price > 0 && !isNaN(d.dist) && d.dist <= 7);

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
    const margin = { left: 60, right: 40, top: 50, bottom: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    if (data.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#666")
        .text("No data found or file missing.");
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

    const xScale = d3.scaleLinear()
      .domain([0, 7])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.avgPrice) * 1.1])
      .range([innerHeight, 0]);

    const xAxisGenerator = d3.axisBottom(xScale);
    const yAxisGenerator = d3.axisLeft(yScale)
      .ticks(10)
      .tickFormat((d) => "€" + d3.format("~s")(d));

    innerChart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxisGenerator);

    innerChart.append("g")
      .call(yAxisGenerator);

    innerChart.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Distance from City Center (km)");

    innerChart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Average Price (EUR)");

    const lineGenerator = d3.line()
      .x((d) => xScale(d.dist))
      .y((d) => yScale(d.avgPrice))
      .curve(d3.curveCardinal); 

    innerChart.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 3)
      .attr("d", lineGenerator);

    innerChart.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.dist))
      .attr("cy", (d) => yScale(d.avgPrice))
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block").html(`
          <strong>Distance:</strong> ${d.dist} - ${d.dist + 0.5} km<br/>
          <strong>Avg Price:</strong> €${Math.round(d.avgPrice)}
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
      <div style={{ padding: 20 }}>
        {this.state.loading && <p style={{ color: "#888" }}>Loading data...</p>}
        <svg 
          ref={this.svgRef} 
          style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: "8px" }}
        ></svg>
      </div>
    );
  }
}


const Dashboard = () => {
  const [selectedCity, setSelectedCity] = useState("Amsterdam");
  const [isWeekend, setIsWeekend] = useState(false); 

  const fileName = `${selectedCity.toLowerCase()}_${isWeekend ? 'weekends' : 'weekdays'}.csv`;

  
  const containerStyle = {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 20px"
  };

  const headerStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px"
  };

  const controlsStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  };


  const selectStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "160px"
  };

 
  const toggleContainerStyle = {
    display: "flex",
    background: "#e9ecef",
    padding: "4px",
    borderRadius: "8px"
  };

  const toggleBtnStyle = (active) => ({
    padding: "8px 16px",
    border: "none",
    background: active ? "white" : "transparent",
    color: active ? "black" : "#6c757d",
    fontWeight: active ? "600" : "400",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: active ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
    transition: "all 0.2s"
  });

  return (
    <div style={containerStyle}>
     
      <div style={headerStyle}>
        <div>
           <h2 style={{ margin: "0 0 5px 0", color: "#343a40" }}>AirBnb Prices</h2>
           <p style={{ margin: 0, color: "#6c757d" }}>
             Analyzing price trends vs distance
           </p>
        </div>

        <div style={controlsStyle}>
         
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            style={selectStyle}
          >
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>


          <div style={toggleContainerStyle}>
            <button style={toggleBtnStyle(!isWeekend)} onClick={() => setIsWeekend(false)}>
              Weekdays
            </button>
            <button style={toggleBtnStyle(isWeekend)} onClick={() => setIsWeekend(true)}>
              Weekends
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
         <PriceDistanceLine key={fileName} fileName={fileName} />
      </div>
    </div>
  );
};

export default Dashboard;