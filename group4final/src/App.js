import { useState } from "react";
import BarChart from "./components/bar_chart";
import ScatterPlot from "./components/scatter_plot";
import GeovisFilter from "./components/geovis_filter";

function App() {
  const [view, setView] = useState("bar");

  return (
    <div>
      <select onChange={(e) => setView(e.target.value)}>
        <option value="bar">Bar Chart</option>
        <option value="scatter">Scatter Plot</option>
        <option value="geo">Geographical Visualization</option>
      </select>

      {view === "bar" && <BarChart />}
      {view === "scatter" && <ScatterPlot />}
      {view === "geo" && <GeovisFilter />}
    </div>
  );
}

export default App;
