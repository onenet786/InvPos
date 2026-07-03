import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowRightLeft, Sliders } from 'lucide-react';

export default function Stock() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'manager', 'inventory_staff']);
  const [stock, setStock] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', branchId: '', type: 'damage', quantity: 0, reason: '' });
  const [transferForm, setTransferForm] = useState({ productId: '', fromBranchId: '', toBranchId: '', quantity: 0, notes: '' });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchStock();
    fetchProducts();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data } = await api.get('/branches');
    setBranches(data.data);
  };

  const fetchStock = async () => {
    const params = {};
    if (selectedBranch) params.branchId = selectedBranch;
    const { data } = await api.get('/stock', { params });
    setStock(data.data);
  };

  const fetchProducts = async () => {
    const { data } = await api.get('/products?limit=100');
    setProducts(data.data);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock/adjust', adjustForm);
      setShowAdjust(false);
      setAdjustForm({ productId: '', branchId: '', type: 'damage', quantity: 0, reason: '' });
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.error || 'Adjustment failed');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock/transfer', transferForm);
      setShowTransfer(false);
      setTransferForm({ productId: '', fromBranchId: '', toBranchId: '', quantity: 0, notes: '' });
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.error || 'Transfer failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setShowAdjust(true)} className="btn-primary flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Stock Adjustment
            </button>
            <button onClick={() => setShowTransfer(true)} className="btn-secondary flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Stock
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="input max-w-xs">
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Product</th>
              <th className="table-header">SKU</th>
              <th className="table-header">Branch</th>
              <th className="table-header text-center">Quantity</th>
              <th className="table-header text-center">Reserved</th>
              <th className="table-header text-center">Available</th>
              <th className="table-header text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stock.map((s) => {
              const isLow = s.quantity <= (s.Product?.reorderThreshold || 0);
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{s.Product?.name}</td>
                  <td className="table-cell font-mono text-xs">{s.Product?.sku}</td>
                  <td className="table-cell">{s.branchId}</td>
                  <td className="table-cell text-center font-medium">{s.quantity}</td>
                  <td className="table-cell text-center text-gray-500">{s.reservedQuantity}</td>
                  <td className="table-cell text-center">{s.quantity - s.reservedQuantity}</td>
                  <td className="table-cell text-center">
                    {isLow ? (
                      <span className="badge bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">In Stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdjust && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Stock Adjustment</h2>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <select value={adjustForm.productId} onChange={(e) => setAdjustForm({...adjustForm, productId: e.target.value})} className="input" required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Branch</label>
                <select value={adjustForm.branchId} onChange={(e) => setAdjustForm({...adjustForm, branchId: e.target.value})} className="input" required>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select value={adjustForm.type} onChange={(e) => setAdjustForm({...adjustForm, type: e.target.value})} className="input">
                  <option value="damage">Damage</option>
                  <option value="loss">Loss</option>
                  <option value="return">Return</option>
                  <option value="initial_stock">Initial Stock</option>
                  <option value="correction">Correction</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason</label>
                <textarea value={adjustForm.reason} onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})} className="input" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Adjust</button>
                <button type="button" onClick={() => setShowAdjust(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Transfer Stock</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <select value={transferForm.productId} onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})} className="input" required>
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From Branch</label>
                <select value={transferForm.fromBranchId} onChange={(e) => setTransferForm({...transferForm, fromBranchId: e.target.value})} className="input" required>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Branch</label>
                <select value={transferForm.toBranchId} onChange={(e) => setTransferForm({...transferForm, toBranchId: e.target.value})} className="input" required>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <input type="number" value={transferForm.quantity} onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 0})} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea value={transferForm.notes} onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})} className="input" rows={2} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Transfer</button>
                <button type="button" onClick={() => setShowTransfer(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
