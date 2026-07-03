import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Search, Eye, X, Star } from 'lucide-react';

export default function Customers() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'manager', 'cashier']);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', dateOfBirth: '', notes: '' });

  useEffect(() => { fetchCustomers(); }, [page, search]);

  const fetchCustomers = async () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    const { data } = await api.get('/customers', { params });
    setCustomers(data.data);
    setPagination(data.pagination);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
      } else {
        await api.post('/customers', form);
      }
      setShowModal(false);
      setEditing(null);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', dateOfBirth: c.dateOfBirth || '', notes: c.notes || '' });
    setShowModal(true);
  };

  const viewCustomer = async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    setViewing(data);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        {canEdit && (
          <button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', dateOfBirth: '', notes: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        )}
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10" placeholder="Search customers..." />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Email</th>
              <th className="table-header text-center">Loyalty Points</th>
              <th className="table-header text-right">Credit Balance</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{c.name}</td>
                <td className="table-cell">{c.phone || '-'}</td>
                <td className="table-cell">{c.email || '-'}</td>
                <td className="table-cell text-center">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {c.loyaltyPoints}
                  </span>
                </td>
                <td className="table-cell text-right">Rs.{parseFloat(c.creditBalance).toFixed(2)}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => viewCustomer(c.id)} className="text-primary-600 hover:text-primary-800"><Eye className="w-4 h-4" /></button>
                    {canEdit && <button onClick={() => handleEdit(c)} className="text-gray-500 hover:text-gray-700"><Edit className="w-4 h-4" /></button>}
                  </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" placeholder="Name *" required />
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input" placeholder="Email" />
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" placeholder="Phone" />
              <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input" placeholder="Address" rows={2} />
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} className="input" />
              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input" placeholder="Notes" rows={2} />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{viewing.customer.name}</h2>
              <button onClick={() => setViewing(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Phone:</span> {viewing.customer.phone || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {viewing.customer.email || '-'}</div>
              <div><span className="text-gray-500">Loyalty Points:</span> {viewing.customer.loyaltyPoints}</div>
              <div><span className="text-gray-500">Credit Balance:</span> Rs.{parseFloat(viewing.customer.creditBalance).toFixed(2)}</div>
            </div>
            <h3 className="font-medium mb-2">Purchase History</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {viewing.purchaseHistory?.length === 0 ? (
                <p className="text-gray-400 text-sm">No purchases yet</p>
              ) : (
                viewing.purchaseHistory?.map((sale) => (
                  <div key={sale.id} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <p className="font-medium">{sale.saleNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(sale.saleDate).toLocaleDateString()}</p>
                    </div>
                    <span className="font-medium">Rs.{parseFloat(sale.total).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
