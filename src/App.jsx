import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import PriceGraph from "./pages/price-graph";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/price-graph" element={<PriceGraph />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
