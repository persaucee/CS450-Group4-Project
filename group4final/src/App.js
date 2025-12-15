import './App.css';
import PriceDistanceScatter from './charts/PriceDistanceScatter';
import ValueMatrix from './charts/ValueMatrix';

function App() {
  return (
    <div className="App">
     <PriceDistanceScatter />
     <ValueMatrix />
    </div>
  );
}

export default App;
