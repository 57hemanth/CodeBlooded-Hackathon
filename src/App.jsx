import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import PriceGraph from "./pages/price-graph";
import Homepage from "./pages/homepage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/price-graph" element={<PriceGraph />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
