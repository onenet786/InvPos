import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit, Trash2, X, Barcode } from 'lucide-react';

export default function Products() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'manager', 'inventory_staff']);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    sku: '', barcode: '', name: '', description: '', categoryId: '',
    unit: 'piece', costPrice: 0, salePrice: 0, taxRate: 0, reorderThreshold: 10,
    hasBatchTracking: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search]);

  const fetchProducts = async () => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    const { data } = await api.get('/products', { params });
    setProducts(data.data);
    setPagination(data.pagination);
  };

  const fetchCategories = async () => {
    const { data } = await api.get('/categories');
    setCategories(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post('/products', form);
      }
      setShowModal(false);
      setEditing(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId || '',
      unit: product.unit,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      taxRate: product.taxRate,
      reorderThreshold: product.reorderThreshold,
      hasBatchTracking: product.hasBatchTracking,
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const generateBarcode = async (id) => {
    await api.post(`/products/${id}/barcode`);
    fetchProducts();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); setForm({ sku: '', barcode: '', name: '', description: '', categoryId: '', unit: 'piece', costPrice: 0, salePrice: 0, taxRate: 0, reorderThreshold: 10, hasBatchTracking: false }); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input pl-10"
          placeholder="Search by name, SKU, or barcode..."
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">SKU</th>
              <th className="table-header">Name</th>
              <th className="table-header">Category</th>
              <th className="table-header text-right">Cost</th>
              <th className="table-header text-right">Sale Price</th>
              <th className="table-header text-right">Tax%</th>
              <th className="table-header text-center">Reorder</th>
              <th className="table-header text-center">Stock</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{p.sku}</td>
                <td className="table-cell font-medium">{p.name}</td>
                <td className="table-cell">{p.Category?.name || '-'}</td>
                <td className="table-cell text-right">${parseFloat(p.costPrice).toFixed(2)}</td>
                <td className="table-cell text-right font-medium">${parseFloat(p.salePrice).toFixed(2)}</td>
                <td className="table-cell text-right">{parseFloat(p.taxRate).toFixed(1)}%</td>
                <td className="table-cell text-center">{p.reorderThreshold}</td>
                <td className="table-cell text-center">
                  {p.Stock?.reduce((sum, s) => sum + s.quantity, 0) || 0}
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    {canEdit && (
                      <>
                        <button onClick={() => handleEdit(p)} className="text-primary-600 hover:text-primary-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => generateBarcode(p.id)} className="text-gray-500 hover:text-gray-700">
                          <Barcode className="w-4 h-4" />
                        </button>
                        {hasRole(['admin', 'manager']) && (
                          <button onClick={() => handleDeactivate(p.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
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
          <span className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} items)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">SKU *</label>
                <input type="text" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Barcode</label>
                <input type="text" value={form.barcode} onChange={(e) => setForm({...form, barcode: e.target.value})} className="input" placeholder="Auto-generated if empty" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" required />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({...form, categoryId: e.target.value})} className="input">
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cost Price</label>
                <input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({...form, costPrice: parseFloat(e.target.value) || 0})} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Sale Price</label>
                <input type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({...form, salePrice: parseFloat(e.target.value) || 0})} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tax Rate (%)</label>
                <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({...form, taxRate: parseFloat(e.target.value) || 0})} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reorder Threshold</label>
                <input type="number" value={form.reorderThreshold} onChange={(e) => setForm({...form, reorderThreshold: parseInt(e.target.value) || 0})} className="input" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.hasBatchTracking} onChange={(e) => setForm({...form, hasBatchTracking: e.target.checked})} className="rounded" />
                  <span className="text-sm font-medium text-gray-700">Batch/Expiry Tracking</span>
                </label>
              </div>
              <div className="col-span-2 flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
