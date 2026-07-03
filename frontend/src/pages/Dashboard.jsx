import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCount: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [salesRes, productsRes, lowStockRes, customersRes] = await Promise.all([
          api.get('/reports/sales?period=daily'),
          api.get('/products?limit=1'),
          api.get('/products/low-stock'),
          api.get('/customers?limit=1'),
        ]);

        setStats({
          todaySales: salesRes.data?.summary?.totalRevenue || 0,
          todayCount: salesRes.data?.summary?.totalSales || 0,
          totalProducts: productsRes.data?.pagination?.total || 0,
          lowStockCount: lowStockRes.data?.data?.length || 0,
          totalCustomers: customersRes.data?.pagination?.total || 0,
          monthlyRevenue: 0,
        });
      } catch {
        // ignore errors on dashboard
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Today's Sales", value: `$${stats.todaySales.toFixed(2)}`, icon: DollarSign, color: 'bg-green-500' },
    { label: "Today's Transactions", value: stats.todayCount, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-purple-500' },
    { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-500' },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {user?.firstName || user?.username}! Here's your store overview.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
