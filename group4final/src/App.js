import './App.css';
import BarChart from './charts/bar_chart';
import PriceDistanceScatter from './charts/PriceDistanceScatter';
import ValueMatrix from './charts/ValueMatrix';

function App() {
  return (
    <div className="App">
     <PriceDistanceScatter />
     <BarChart />
     <ValueMatrix />
    </div>
  );
}

export default App;
