import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, DollarSign, TrendingUp, Package, Award, UserCheck } from 'lucide-react';

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab) fetchReport();
  }, [tab, period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: result } = await api.get(`/reports/${tab}?period=${period}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(`${api.defaults.baseURL}/reports/export?type=sales&period=${period}`, '_blank');
  };

  const tabs = [
    { key: 'sales', label: 'Sales', icon: DollarSign },
    { key: 'profit', label: 'Profit', icon: TrendingUp },
    { key: 'stock-valuation', label: 'Stock Valuation', icon: Package },
    { key: 'best-selling', label: 'Best Selling', icon: Award },
    { key: 'slow-moving', label: 'Slow Moving', icon: Package },
    { key: 'cashier', label: 'Cashier', icon: UserCheck },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setData(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input max-w-xs">
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading report...</div></div>
      ) : !data ? (
        <div className="flex items-center justify-center h-64"><div className="text-gray-400">No data available</div></div>
      ) : tab === 'sales' ? (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card"><p className="text-sm text-gray-500">Total Sales</p><p className="text-2xl font-bold">{data.summary.totalSales}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold text-green-600">Rs.{data.summary.totalRevenue.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Tax Collected</p><p className="text-2xl font-bold">Rs.{data.summary.totalTax.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Avg Sale Value</p><p className="text-2xl font-bold">Rs.{data.summary.avgSaleValue.toFixed(2)}</p></div>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="table-header">Sale #</th><th className="table-header">Date</th><th className="table-header text-right">Total</th><th className="table-header">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.sales?.slice(0, 20).map((s) => (
                  <tr key={s.id}>
                    <td className="table-cell font-mono text-xs">{s.saleNumber}</td>
                    <td className="table-cell">{new Date(s.saleDate).toLocaleString()}</td>
                    <td className="table-cell text-right font-medium">Rs.{parseFloat(s.total).toFixed(2)}</td>
                    <td className="table-cell"><span className="badge bg-green-100 text-green-700">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'profit' ? (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold">Rs.{data.summary.totalRevenue.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Cost</p><p className="text-2xl font-bold text-red-600">Rs.{data.summary.totalCost.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Profit</p><p className="text-2xl font-bold text-green-600">Rs.{data.summary.totalProfit.toFixed(2)}</p></div>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="table-header">Product</th><th className="table-header text-center">Qty Sold</th><th className="table-header text-right">Revenue</th><th className="table-header text-right">Cost</th><th className="table-header text-right">Profit</th><th className="table-header text-right">Margin</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.products?.map((p) => (
                  <tr key={p.productId}>
                    <td className="table-cell font-medium">{p.productName}</td>
                    <td className="table-cell text-center">{p.quantitySold}</td>
                    <td className="table-cell text-right">Rs.{p.revenue.toFixed(2)}</td>
                    <td className="table-cell text-right">Rs.{p.cost.toFixed(2)}</td>
                    <td className="table-cell text-right font-medium text-green-600">Rs.{p.profit.toFixed(2)}</td>
                    <td className="table-cell text-right">{p.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'stock-valuation' ? (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card"><p className="text-sm text-gray-500">Total Cost Value</p><p className="text-2xl font-bold">Rs.{data.summary.totalCostValue.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Total Retail Value</p><p className="text-2xl font-bold">Rs.{data.summary.totalRetailValue.toFixed(2)}</p></div>
            <div className="card"><p className="text-sm text-gray-500">Potential Profit</p><p className="text-2xl font-bold text-green-600">Rs.{data.summary.potentialProfit.toFixed(2)}</p></div>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="table-header">Product</th><th className="table-header text-center">Qty</th><th className="table-header text-right">Cost Value</th><th className="table-header text-right">Retail Value</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items?.map((i) => (
                  <tr key={i.productId}>
                    <td className="table-cell font-medium">{i.productName}</td>
                    <td className="table-cell text-center">{i.quantity}</td>
                    <td className="table-cell text-right">Rs.{i.costValue.toFixed(2)}</td>
                    <td className="table-cell text-right">Rs.{i.retailValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'best-selling' || tab === 'slow-moving' ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">SKU</th>
                {tab === 'best-selling' ? (
                  <><th className="table-header text-center">Qty Sold</th><th className="table-header text-right">Revenue</th></>
                ) : (
                  <><th className="table-header text-center">Stock Qty</th><th className="table-header text-right">Stock Value</th></>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data?.map((p, idx) => (
                <tr key={idx}>
                  <td className="table-cell font-medium">{p.productName}</td>
                  <td className="table-cell font-mono text-xs">{p.sku}</td>
                  {tab === 'best-selling' ? (
                    <><td className="table-cell text-center">{p.quantitySold}</td><td className="table-cell text-right">Rs.{p.revenue.toFixed(2)}</td></>
                  ) : (
                    <><td className="table-cell text-center">{p.stockQuantity}</td><td className="table-cell text-right">Rs.{p.stockValue.toFixed(2)}</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'cashier' ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Cashier</th>
                <th className="table-header text-center">Total Sales</th>
                <th className="table-header text-right">Revenue</th>
                <th className="table-header text-right">Cash</th>
                <th className="table-header text-right">Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data?.map((c) => (
                <tr key={c.cashierId}>
                  <td className="table-cell font-medium">{c.cashierName}</td>
                  <td className="table-cell text-center">{c.totalSales}</td>
                  <td className="table-cell text-right font-medium">Rs.{c.totalRevenue.toFixed(2)}</td>
                  <td className="table-cell text-right">Rs.{c.paymentBreakdown.cash.toFixed(2)}</td>
                  <td className="table-cell text-right">Rs.{c.paymentBreakdown.card.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
