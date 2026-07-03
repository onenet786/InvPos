import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, X } from 'lucide-react';

export default function Suppliers() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'manager', 'inventory_staff']);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '' });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    const { data } = await api.get('/suppliers');
    setSuppliers(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
      } else {
        await api.post('/suppliers', form);
      }
      setShowModal(false);
      setEditing(null);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '', paymentTerms: s.paymentTerms || '' });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        {canEdit && (
          <button onClick={() => { setEditing(null); setForm({ name: '', contactPerson: '', email: '', phone: '', address: '', paymentTerms: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.contactPerson || 'No contact'}</p>
              </div>
              {canEdit && (
                <button onClick={() => handleEdit(s)} className="text-primary-600 hover:text-primary-800">
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {s.email && <p>{s.email}</p>}
              {s.phone && <p>{s.phone}</p>}
              {s.paymentTerms && <p className="text-gray-500">Terms: {s.paymentTerms}</p>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" placeholder="Name *" required />
              <input type="text" value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})} className="input" placeholder="Contact Person" />
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input" placeholder="Email" />
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" placeholder="Phone" />
              <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input" placeholder="Address" rows={2} />
              <input type="text" value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})} className="input" placeholder="Payment Terms" />
              <div className="flex gap-2">
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
