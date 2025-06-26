import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart2, Star, PieChart, Users, LineChart } from 'lucide-react';

const features = [
  {
    icon: <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />, 
    title: 'Restaurant Analytics',
    desc: 'Analyze pricing, ratings, and discounts across platforms and competitors.'
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-green-500 mb-2" />, 
    title: 'Insights',
    desc: 'View total sales, orders, average spends, and sales trends with interactive graphs.'
  },
  {
    icon: <Star className="w-8 h-8 text-yellow-500 mb-2" />, 
    title: 'Top Products',
    desc: 'Discover the best-selling products for each period.'
  },
  {
    icon: <PieChart className="w-8 h-8 text-purple-500 mb-2" />, 
    title: 'Top Categories',
    desc: 'See which product categories are driving your business.'
  },
  {
    icon: <Users className="w-8 h-8 text-pink-500 mb-2" />, 
    title: 'Competitor Analysis',
    desc: 'Compare your performance with top competitors in your segment.'
  },
  {
    icon: <LineChart className="w-8 h-8 text-indigo-500 mb-2" />, 
    title: 'Interactive Graphs',
    desc: 'Visualize trends and patterns with beautiful, interactive charts.'
  },
];

const Homepage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4 py-12">
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">Welcome to <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Dine Metrics</span></h1>
        <p className="text-lg text-gray-700 mb-8">Your all-in-one dashboard for restaurant analytics, insights, and competitor benchmarking. Make smarter decisions with beautiful, actionable data.</p>
        <button
          onClick={() => navigate('/dashboard')} 
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition text-lg"
        >
          Go to Dashboard
        </button>
      </div>
      <div className="max-w-5xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div key={idx} className="bg-white bg-opacity-80 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform">
            {feature.icon}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Homepage; 