

import "./App.css"; // <--- Import the CSS file here
import BarChart from "./charts/bar_chart";
import GeovisFilter from "./charts/geovis_filter";
import PriceDistanceScatter from "./charts/PriceDistanceScatter";
import ValueMatrix from "./charts/ValueMatrix";
const MainDashboard = () => {
  // --- STYLES ---
  const styles = {
    container: {
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: "#f4f6f8",
      minHeight: "100vh",
      padding: "20px",
      boxSizing: "border-box"
    },
    header: {
      marginBottom: "20px",
      backgroundColor: "white",
      padding: "15px 25px",
      borderRadius: "8px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
    },
    title: {
      margin: 0,
      color: "#2c3e50",
      fontSize: "24px"
    },
    subtitle: {
      color: "#6c757d",
      fontSize: "14px",
      marginTop: "5px"
    },
    
    // --- 2x2 GRID LAYOUT ---
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      paddingBottom: "40px"
    },
    
    // --- CARD STYLES ---
    card: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      minHeight: "500px",
      overflow: "auto", 
      display: "flex",
      flexDirection: "column"
    },
    cardHeader: {
      marginBottom: "15px",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#444",
      borderBottom: "1px solid #eee",
      paddingBottom: "10px"
    }
  };

  return (
    <div style={styles.container}>
      

      <header style={styles.header}>
        <h1 style={styles.title}>European Rental Analytics</h1>
        <p style={styles.subtitle}>
          Comprehensive overview of Airbnb market trends across Europe.
        </p>
      </header>


      <div style={styles.grid}>
        

        <div style={styles.card}>
          <div style={styles.cardHeader}>Geographic Overview</div>
          <div style={{flex: 1}}>
            <GeovisFilter />
          </div>
        </div>


        <div style={styles.card}>
          <div style={styles.cardHeader}>Price Trends vs Distance</div>
          <div style={{flex: 1}}>
            {/* Charts manage their own data now */}
            <PriceDistanceScatter />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Room Type Distribution</div>
          <div style={{flex: 1}}>
            <BarChart />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Key Metrics & Value Matrix</div>
          <div style={{flex: 1}}>
            <ValueMatrix />
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;