import { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye, X } from 'lucide-react';

const statusColors = {
  completed: 'bg-green-100 text-green-700',
  held: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
  partially_returned: 'bg-orange-100 text-orange-700',
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);

  useEffect(() => { fetchSales(); }, [page, statusFilter]);

  const fetchSales = async () => {
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    const { data } = await api.get('/sales', { params });
    setSales(data.data);
    setPagination(data.pagination);
  };

  const viewSale = async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    setViewing(data.sale);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>

      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input max-w-xs">
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="held">Held</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
          <option value="partially_returned">Partially Returned</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Sale #</th>
              <th className="table-header">Date</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Status</th>
              <th className="table-header text-right">Total</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{s.saleNumber}</td>
                <td className="table-cell">{new Date(s.saleDate).toLocaleString()}</td>
                <td className="table-cell">{s.Customer?.name || 'Walk-in'}</td>
                <td className="table-cell">
                  <span className={`badge ${statusColors[s.status]}`}>{s.status.replace('_', ' ')}</span>
                </td>
                <td className="table-cell text-right font-medium">Rs.{parseFloat(s.total).toFixed(2)}</td>
                <td className="table-cell">
                  <button onClick={() => viewSale(s.id)} className="text-primary-600 hover:text-primary-800">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="btn-secondary">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="btn-secondary">Next</button>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Sale Details</h2>
              <button onClick={() => setViewing(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Receipt #</span><span className="font-medium">{viewing.saleNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{new Date(viewing.saleDate).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{viewing.Customer?.name || 'Walk-in'}</span></div>
            </div>
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-2">
              {viewing.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.Product?.name}</span>
                  <span>Rs.{parseFloat(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>Rs.{parseFloat(viewing.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-Rs.{parseFloat(viewing.discount).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>Rs.{parseFloat(viewing.tax).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-600">Rs.{parseFloat(viewing.total).toFixed(2)}</span></div>
            </div>
            <div className="mt-3 space-y-1">
              {viewing.payments?.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">{p.method.replace('_', ' ')}</span>
                  <span>Rs.{parseFloat(p.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
