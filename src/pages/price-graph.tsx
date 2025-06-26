import React from 'react';
import { useLocation, useNavigate, Location } from 'react-router-dom';
import analysisData from '../data/analysis.json';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Product = {
  Product: string;
  todayPriceZomato: number;
  todayPriceSwiggy: number;
  ZomatoRating: number;
  SwiggyRating: number;
  ZomatoDiscount: string;
  SwiggyDiscount: string;
  past30DaysZomato: number[];
  past30DaysSwiggy: number[];
};

type Restaurant = {
  name: string;
  type: string;
  products: Product[];
};

type PriceGraphLocationState = {
  platform: string;
  restaurantName: string;
  productName: string;
};

const PriceGraph = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { platform, restaurantName, productName } = (location.state || {}) as PriceGraphLocationState;

  // Find the restaurant and product
  const restaurant = (analysisData as Restaurant[]).find(r => r.name === restaurantName);
  const product = restaurant?.products.find(p => p.Product.toLowerCase() === productName.toLowerCase());

  let priceData: number[] = [];
  let label = '';
  if (platform === 'Zomato') {
    priceData = product?.past30DaysZomato || [];
    label = 'Zomato';
  } else if (platform === 'Swiggy') {
    priceData = product?.past30DaysSwiggy || [];
    label = 'Swiggy';
  } else {
    priceData = [];
    label = '';
  }

  const data = {
    labels: Array.from({ length: priceData.length }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: `${label} Price (Last 30 Days)`,
        data: priceData,
        fill: false,
        borderColor: label === 'Zomato' ? 'rgb(239,68,68)' : 'rgb(251,146,60)',
        backgroundColor: label === 'Zomato' ? 'rgb(239,68,68,0.2)' : 'rgb(251,146,60,0.2)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: `${restaurantName} - ${productName} (${label}) Price Trend`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price (₹)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Day',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back
      </button>
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PriceGraph; 