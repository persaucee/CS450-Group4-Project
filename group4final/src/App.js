import "./App.css";
import BarChart from "./charts/bar_chart";
import GeovisFilter from "./charts/geovis_filter";
import PriceDistanceScatter from "./charts/PriceDistanceScatter";
import ValueMatrix from "./charts/ValueMatrix";
const MainDashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">European AirBnb Rental Analytics</h1>
        <p className="dashboard-subtitle">
          Comprehensive overview of Airbnb market trends across Europe.
        </p>
      </header>

      <div className="dashboard-grid">
        
        <div className="dashboard-card">
          <div className="card-header">Geographic Overview</div>
          <div className="card-body">
            <GeovisFilter />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">Price Trends vs Distance</div>
          <div className="card-body">
            <PriceDistanceScatter />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">Room Type Distribution</div>
          <div className="card-body">
            <BarChart />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">Key Metrics & Value Matrix</div>
          <div className="card-body">
            <ValueMatrix />
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;