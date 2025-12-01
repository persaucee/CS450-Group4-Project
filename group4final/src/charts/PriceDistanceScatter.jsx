import { useEffect, useState } from "react";
import Plot from "react-plotly.js";

const PriceDistanceScatter = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const csvPath = process.env.PUBLIC_URL + "/data/amsterdam_weekdays.csv";

    fetch(csvPath)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n");

        // parse data from csv
        const rawHeader = lines[0].split(",");
        const header = rawHeader.slice(1).map((h) => h.trim()); 
        console.log("HEADER:", header);
        const realSumIndex = header.indexOf("realSum");
        const distIndex = header.indexOf("dist");
        console.log("Indices:", { realSumIndex, distIndex });
        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          const cleanCols = cols.slice(1);

          const price = parseFloat(cleanCols[realSumIndex]);
          const dist = parseFloat(cleanCols[distIndex]);

          if (!isNaN(price) && !isNaN(dist)) {
            parsedRows.push({ price, dist });
          }
        }
        console.log("Parsed sample:", parsedRows.slice(0, 20));
        setData(parsedRows);
      });
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <Plot
  data={[
    {
      x: data.map((d) => d.dist),
      y: data.map((d) => d.price),
      mode: "markers",
      type: "scatter",
      marker: {
        size: 4,         // smaller points
        opacity: 0.5,    // less overlap
        color: "#1f77b4"
      },
      text: data.map(
        (d) => `Price: €${d.price}<br>Distance: ${d.dist} km`
      ),
      hoverinfo: "text",
    },
  ]}
  layout={{
    title: "Price vs Distance from City Center (Log Scale for Clarity)",
    xaxis: {
      title: "Distance from City Center (km)",
      zeroline: false,
    },
    yaxis: {
      title: "Price (EUR)",
      type: "log",          // <-- GAME CHANGER
      autorange: true,
      zeroline: false,
    },
    height: 650,
    margin: { t: 80, l: 80, r: 40, b: 80 },
  }}
/>

    </div>
  );
};

export default PriceDistanceScatter;
