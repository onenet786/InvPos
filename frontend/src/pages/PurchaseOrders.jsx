import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, CheckCircle, XCircle, Truck, X } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  partially_received: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PurchaseOrders() {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['admin', 'manager', 'inventory_staff']);
  const canApprove = hasRole(['admin', 'manager']);
  const [pos, setPos] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplierId: '', branchId: '', expectedDate: '', notes: '', items: [] });

  useEffect(() => { fetchPOs(); fetchSuppliers(); fetchBranches(); fetchProducts(); }, [page, statusFilter]);

  const fetchPOs = async () => {
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    const { data } = await api.get('/purchase-orders', { params });
    setPos(data.data);
    setPagination(data.pagination);
  };

  const fetchSuppliers = async () => { const { data } = await api.get('/suppliers'); setSuppliers(data.data); };
  const fetchBranches = async () => { const { data } = await api.get('/branches'); setBranches(data.data); };
  const fetchProducts = async () => { const { data } = await api.get('/products?limit=100'); setProducts(data.data); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/purchase-orders', form);
      setShowCreate(false);
      setForm({ supplierId: '', branchId: '', expectedDate: '', notes: '', items: [] });
      fetchPOs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create PO');
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'receive') {
        const po = await api.get(`/purchase-orders/${id}`);
        const receivedItems = po.data.purchaseOrder.items
          .filter((item) => item.quantityReceived < item.quantityOrdered)
          .map((item) => ({ poItemId: item.id, quantity: item.quantityOrdered - item.quantityReceived }));
        if (receivedItems.length === 0) { alert('All items already received'); return; }
        await api.post(`/purchase-orders/${id}/receive`, { receivedItems, notes: 'Full receipt' });
      } else {
        await api.post(`/purchase-orders/${id}/${action}`);
      }
      fetchPOs();
      if (viewing) {
        const { data } = await api.get(`/purchase-orders/${id}`);
        setViewing(data.purchaseOrder);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productId: '', quantityOrdered: 1, unitCost: 0, taxRate: 0 }] });
  };

  const updateItem = (idx, field, value) => {
    setForm({
      ...form,
      items: form.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Purchase Order
          </button>
        )}
      </div>

      <div className="mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input max-w-xs">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="partially_received">Partially Received</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">PO Number</th>
              <th className="table-header">Supplier</th>
              <th className="table-header">Status</th>
              <th className="table-header text-right">Total</th>
              <th className="table-header">Order Date</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pos.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{po.poNumber}</td>
                <td className="table-cell">{po.Supplier?.name}</td>
                <td className="table-cell">
                  <span className={`badge ${statusColors[po.status]}`}>{po.status.replace('_', ' ')}</span>
                </td>
                <td className="table-cell text-right font-medium">${parseFloat(po.total).toFixed(2)}</td>
                <td className="table-cell">{new Date(po.orderDate).toLocaleDateString()}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={async () => { const { data } = await api.get(`/purchase-orders/${po.id}`); setViewing(data.purchaseOrder); }} className="text-primary-600 hover:text-primary-800">
                      <Eye className="w-4 h-4" />
                    </button>
                    {po.status === 'draft' && canCreate && (
                      <button onClick={() => handleAction(po.id, 'submit')} className="text-yellow-600 hover:text-yellow-800 text-xs font-medium">Submit</button>
                    )}
                    {po.status === 'pending' && canApprove && (
                      <button onClick={() => handleAction(po.id, 'approve')} className="text-green-600 hover:text-green-800">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {['approved', 'partially_received'].includes(po.status) && canCreate && (
                      <button onClick={() => handleAction(po.id, 'receive')} className="text-blue-600 hover:text-blue-800">
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                    {['draft', 'pending', 'approved'].includes(po.status) && canApprove && (
                      <button onClick={() => handleAction(po.id, 'cancel')} className="text-red-500 hover:text-red-700">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Purchase Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Supplier *</label>
                  <select value={form.supplierId} onChange={(e) => setForm({...form, supplierId: e.target.value})} className="input" required>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Branch *</label>
                  <select value={form.branchId} onChange={(e) => setForm({...form, branchId: e.target.value})} className="input" required>
                    <option value="">Select branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Expected Date</label>
                <input type="date" value={form.expectedDate} onChange={(e) => setForm({...form, expectedDate: e.target.value})} className="input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Items</label>
                  <button type="button" onClick={addItem} className="text-sm text-primary-600">+ Add Item</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} className="input flex-1" required>
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" value={item.quantityOrdered} onChange={(e) => updateItem(idx, 'quantityOrdered', parseInt(e.target.value) || 0)} className="input w-20" placeholder="Qty" />
                    <input type="number" step="0.01" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)} className="input w-24" placeholder="Cost" />
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500"><X className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>

              <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="input" placeholder="Notes" rows={2} />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Create PO</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{viewing.poNumber}</h2>
                <span className={`badge ${statusColors[viewing.status]}`}>{viewing.status.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Supplier:</span> {viewing.Supplier?.name}</div>
              <div><span className="text-gray-500">Order Date:</span> {new Date(viewing.orderDate).toLocaleDateString()}</div>
              <div><span className="text-gray-500">Expected:</span> {viewing.expectedDate ? new Date(viewing.expectedDate).toLocaleDateString() : '-'}</div>
              <div><span className="text-gray-500">Total:</span> ${parseFloat(viewing.total).toFixed(2)}</div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header text-center">Ordered</th>
                  <th className="table-header text-center">Received</th>
                  <th className="table-header text-right">Unit Cost</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {viewing.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell">{item.Product?.name}</td>
                    <td className="table-cell text-center">{item.quantityOrdered}</td>
                    <td className="table-cell text-center">{item.quantityReceived}</td>
                    <td className="table-cell text-right">${parseFloat(item.unitCost).toFixed(2)}</td>
                    <td className="table-cell text-right">${parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
