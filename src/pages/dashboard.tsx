import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp } from 'lucide-react';
import analysisData from '../data/analysis.json';
import { useNavigate } from 'react-router-dom';
import dailyData from '../data/daily.json';
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

console.log(analysisData);

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

const productSuggestions = [
  'Cappuccino',
  'Espresso',
  'Americano',
  'Mocha',
  'Flat White',
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [productName, setProductName] = useState('');
  const [filterType, setFilterType] = useState('Premium');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const [restored, setRestored] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('april');
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Restore state from localStorage on mount, but always recompute searchResults
  useEffect(() => {
    const saved = localStorage.getItem('dashboardState');
    if (saved) {
      const { productName: savedProduct, filterType: savedType } = JSON.parse(saved);
      setProductName(savedProduct || '');
      setFilterType(savedType || 'Premium');
    }
    setRestored(true);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (restored) {
      localStorage.setItem(
        'dashboardState',
        JSON.stringify({ productName, filterType })
      );
    }
  }, [productName, filterType, restored]);

  // Recompute searchResults when productName or filterType changes, but only after restore
  useEffect(() => {
    if (restored && productName.trim()) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName, filterType, restored]);

  const handleSearch = () => {
    if (!productName.trim()) {
      alert('Please enter a product name');
      return;
    }

    const results: any = {
      competitors: [],
      zomato: [],
      swiggy: []
    };

    // Filter restaurants by type and product availability
    (analysisData as Restaurant[]).forEach((restaurant) => {
      // For competitors, apply type filter
      if (restaurant.type === filterType) {
        const product = restaurant.products.find(
          (p) => p.Product.toLowerCase() === productName.trim().toLowerCase()
        );
        if (product) {
          results.competitors.push({
            name: restaurant.name,
            rating: product.ZomatoRating,
            price: product.todayPriceZomato,
            discount: product.ZomatoDiscount,
            type: restaurant.type
          });
        }
      }
      // For Zomato and Swiggy, do NOT apply type filter
      const productForAll = restaurant.products.find(
        (p) => p.Product.toLowerCase() === productName.trim().toLowerCase()
      );
      if (productForAll) {
        results.zomato.push({
          name: restaurant.name,
          rating: productForAll.ZomatoRating,
          price: productForAll.todayPriceZomato,
          discount: productForAll.ZomatoDiscount,
          type: restaurant.type
        });
        results.swiggy.push({
          name: restaurant.name,
          rating: productForAll.SwiggyRating,
          price: productForAll.todayPriceSwiggy,
          discount: productForAll.SwiggyDiscount,
          type: restaurant.type
        });
      }
    });

    // Sort by rating and take top 3
    results.competitors = results.competitors.sort((a, b) => b.rating - a.rating).slice(0, 3);
    results.zomato = results.zomato.sort((a, b) => b.rating - a.rating).slice(0, 3);
    results.swiggy = results.swiggy.sort((a, b) => b.rating - a.rating).slice(0, 3);

    setSearchResults(results);
  };

  // Helper to get month data
  const getMonthData = (month) => {
    return dailyData.find((m) => m.month.toLowerCase() === month.toLowerCase());
  };

  // Compute metrics for selected month
  const monthData = getMonthData(selectedMonth);
  const totalSales = monthData ? monthData.sales.reduce((sum, d) => sum + d.amount, 0) : 0;
  const totalOrders = monthData ? monthData.sales.reduce((sum, d) => sum + d.no_of_orders, 0) : 0;
  const avgSpends = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Prepare graph data: last 7 days vs previous 7 days
  let last7: number[] = [], prev7: number[] = [], last7Labels: string[] = [], prev7Labels: string[] = [];
  if (monthData && monthData.sales.length >= 14) {
    const sales = monthData.sales;
    last7 = sales.slice(-7).map((d) => d.amount);
    prev7 = sales.slice(-14, -7).map((d) => d.amount);
    last7Labels = sales.slice(-7).map((d) => `Day ${d.day}`);
    prev7Labels = sales.slice(-14, -7).map((d) => `Day ${d.day}`);
  }

  const insightsChartData = {
    labels: last7Labels,
    datasets: [
      {
        label: 'Current Week',
        data: last7,
        fill: false,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Previous Week',
        data: prev7,
        fill: false,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const insightsChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: `Sales Comparison (Current Week vs Previous Week)` },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Sales (₹)' },
      },
      x: {
        title: { display: true, text: 'Day' },
      },
    },
  };

  // Map for competitor display names
  const competitorNameMap: Record<string, string> = {
    'True Black': 'Neighbourhood Favourite',
    'Roastery Coffee House': 'Premium Roast Hub',
    'Theory Cafe': 'Theory Cafe',
    'Makobrew': 'High-ValueSpot',
    "Harley's Cafe": 'Benchmark Brewhouse',
  };

  const RestaurantCard = ({ restaurant, platform }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 text-sm">{platform === 'Competitors' && competitorNameMap[restaurant.name] ? competitorNameMap[restaurant.name] : restaurant.name}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{restaurant.type}</span>
      </div>
      <div className="flex items-center mb-2">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="ml-1 text-sm font-medium">{restaurant.rating}</span>
      </div>
      <div className="flex justify-between items-center">
        <span
          className="text-lg font-bold text-green-600 cursor-pointer hover:underline"
          onClick={() => navigate('/price-graph', {
            state: {
              platform,
              restaurantName: restaurant.name,
              productName,
            },
          })}
        >
          ₹{restaurant.price}
        </span>
        <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded">
          {restaurant.discount} OFF
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {platform && `${platform} Platform`}
      </div>
    </div>
  );

  // Prepare daily sales data for modal graph
  const dailySalesLabels = monthData ? monthData.sales.map((d) => `Day ${d.day}`) : [];
  const dailySalesAmounts = monthData ? monthData.sales.map((d) => d.amount) : [];
  const dailySalesChartData = {
    labels: dailySalesLabels,
    datasets: [
      {
        label: 'Daily Sales',
        data: dailySalesAmounts,
        fill: false,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.3,
      },
    ],
  };
  const dailySalesChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: `Daily Sales Trend` },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Sales (₹)' },
      },
      x: {
        title: { display: true, text: 'Day' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Restaurant Analytics</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Insights
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && (
          <div>
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Analysis</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    placeholder="Enter product name (e.g., Cappuccino)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                  />
                  {showSuggestions && productName && (
                    <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md mt-1 w-full max-w-xs">
                      {productSuggestions
                        .filter((p) => p.toLowerCase().includes(productName.toLowerCase()))
                        .map((suggestion) => (
                          <div
                            key={suggestion}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-sm"
                            onMouseDown={() => {
                              setProductName(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      {productSuggestions.filter((p) => p.toLowerCase().includes(productName.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-gray-400 text-sm">No suggestions</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Mid-tier">Mid-tier</option>
                    <option value="Budget">Budget</option>
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </div>
            </div>

            {/* Results Section */}
            {searchResults && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Competitors Column */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Top Competitors
                  </h3>
                  {searchResults.competitors.length > 0 ? (
                    searchResults.competitors.map((restaurant, index) => (
                      <RestaurantCard key={index} restaurant={restaurant} platform="Competitors" />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No competitors found</p>
                  )}
                </div>

                {/* Zomato Column */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    Top on Zomato
                  </h3>
                  {searchResults.zomato.length > 0 ? (
                    searchResults.zomato.map((restaurant, index) => (
                      <RestaurantCard key={index} restaurant={restaurant} platform="Zomato" />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No Zomato data found</p>
                  )}
                </div>

                {/* Swiggy Column */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    Top on Swiggy
                  </h3>
                  {searchResults.swiggy.length > 0 ? (
                    searchResults.swiggy.map((restaurant, index) => (
                      <RestaurantCard key={index} restaurant={restaurant} platform="Swiggy" />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No Swiggy data found</p>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            {!searchResults && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-500">
                    Enter a product name and select a filter type to see competitor analysis across platforms.
                  </p>
                  <div className="mt-4 text-sm text-gray-400">
                    Available products: Cappuccino, Espresso, Americano, Mocha, Flat White
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {/* Month Filter */}
            <div className="flex justify-end mb-6">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="last-week">Last Week</option>
                <option value="april">This Month</option>
                <option value="march">Last Month</option>
                <option value="march">Last 3 Months</option>
                <option value="march">Last 6 Months</option>
                <option value="march">Last 1 Year</option>
              </select>
            </div>
            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div
                className="bg-white rounded-lg shadow p-6 flex flex-col items-center cursor-pointer hover:bg-blue-50 transition"
                onClick={() => setShowSalesModal(true)}
                title="View daily sales graph"
              >
                <div className="text-xs text-gray-500 mb-1">Total Sales</div>
                <div className="text-2xl font-bold text-blue-600">₹{totalSales.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">No of Orders</div>
                <div className="text-2xl font-bold text-green-600">{totalOrders.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">Average Spends</div>
                <div className="text-2xl font-bold text-purple-600">₹{avgSpends.toLocaleString()}</div>
              </div>
            </div>
            {/* Modal for daily sales graph */}
            {showSalesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative animate-fade-in">
                  <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                    onClick={() => setShowSalesModal(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend ({selectedMonth === 'april' ? 'April' : 'March'})</h4>
                  <Line data={dailySalesChartData} options={dailySalesChartOptions} />
                </div>
              </div>
            )}
            {/* Graph */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend (Current Week vs Previous Week)</h3>
              <Line data={insightsChartData} options={insightsChartOptions} />
            </div>
            {/* Top 3 Selling Products */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Selling Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {selectedMonth === 'april' ? (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Cappuccino</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">3%</span>
                      <span className="text-xl font-bold text-blue-600 mb-1">567</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Butter Croissant</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">2.3%</span>
                      <span className="text-xl font-bold text-green-600 mb-1">388</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Alfredo</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-700">2.6%</span>
                      <span className="text-xl font-bold text-purple-600 mb-1">254</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Flat White</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">3.7%</span>
                      <span className="text-xl font-bold text-blue-600 mb-1">483</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Cappuccino</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">2.9%</span>
                      <span className="text-xl font-bold text-green-600 mb-1">341</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Butter Croissant</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-700">2.5%</span>
                      <span className="text-xl font-bold text-purple-600 mb-1">287</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Top Selling Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {selectedMonth === 'april' ? (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Sandwiches & Burgers</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">27%</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Bagels & Croissants</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-pink-50 text-pink-700">19%</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Deserts</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">12%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Bagels & Croissants</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-pink-50 text-pink-700">26%</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Sandwiches & Burgers</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">17%</span>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white shadow-md p-5 flex flex-col items-center hover:shadow-lg transition-shadow">
                      <span className="font-semibold text-gray-900 text-lg mb-2">Breakfast</span>
                      <span className="text-2xl font-medium px-3 py-1 rounded-full bg-green-50 text-green-700">9%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;