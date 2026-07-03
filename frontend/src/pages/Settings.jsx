import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Building2,
  Store,
  Save,
  Plus,
  Edit,
  X,
  Check,
  Phone,
  Mail,
  Globe,
  MapPin,
  Receipt,
  Percent,
  Award,
} from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', email: '', isHeadquarters: false });

  useEffect(() => {
    fetchSettings();
    fetchBranches();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings);
    } catch {
      // ignore
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/branches');
      setBranches(data.data);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/settings', settings);
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, branchForm);
      } else {
        await api.post('/branches', branchForm);
      }
      setShowBranchModal(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save branch');
    }
  };

  const handleEditBranch = (b) => {
    setEditingBranch(b);
    setBranchForm({ name: b.name, code: b.code, address: b.address || '', phone: b.phone || '', email: b.email || '', isHeadquarters: b.isHeadquarters });
    setShowBranchModal(true);
  };

  if (!settings) {
    return <div className="flex h-full items-center justify-center text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Building2 className="w-4 h-4" />
          Company
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'branches' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Store className="w-4 h-4" />
          Branches
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Company Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="input"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tax ID / Registration</label>
                <input
                  type="text"
                  value={settings.taxId || ''}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  className="input"
                  placeholder="Tax ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Website</label>
                <input
                  type="text"
                  value={settings.website || ''}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary-600" />
              Contact Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="input"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="input"
                  placeholder="Email address"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
                <textarea
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          {/* Currency & Tax */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary-600" />
              Currency & Tax
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Currency Symbol</label>
                <input
                  type="text"
                  value={settings.currencySymbol || ''}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="input"
                  placeholder="Rs."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Currency Code</label>
                <input
                  type="text"
                  value={settings.currencyCode || ''}
                  onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                  className="input"
                  placeholder="PKR"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.defaultTaxRate || ''}
                  onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.taxEnabled || false}
                  onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Tax</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loyaltyEnabled || false}
                  onChange={(e) => setSettings({ ...settings, loyaltyEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable Loyalty Program</span>
              </label>
            </div>
            {settings.loyaltyEnabled && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Loyalty Points per {settings.currencySymbol || 'Rs.'}1
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.loyaltyPointsPerDollar || ''}
                  onChange={(e) => setSettings({ ...settings, loyaltyPointsPerDollar: parseFloat(e.target.value) || 0 })}
                  className="input w-40"
                  placeholder="1"
                />
              </div>
            )}
          </div>

          {/* Receipt Customization */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              Receipt Customization
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Receipt Header (optional)</label>
                <textarea
                  value={settings.receiptHeader || ''}
                  onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="e.g. Welcome to our store!"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Receipt Footer</label>
                <textarea
                  value={settings.receiptFooter || ''}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="e.g. Thank you for your business!"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-sm">{branches.length} branch(es) configured</p>
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchForm({ name: '', code: '', address: '', phone: '', email: '', isHeadquarters: false });
                setShowBranchModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          </div>

          <div className="grid gap-4">
            {branches.map((b) => (
              <div key={b.id} className="card p-5 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.isHeadquarters ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{b.name}</h3>
                      {b.isHeadquarters && (
                        <span className="badge bg-primary-100 text-primary-700 text-xs">Headquarters</span>
                      )}
                      <span className={`badge text-xs ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Code: {b.code}</p>
                    {b.address && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {b.address}
                      </p>
                    )}
                    <div className="flex gap-4 mt-1">
                      {b.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {b.phone}
                        </p>
                      )}
                      {b.email && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {b.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEditBranch(b)}
                  className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Branch Modal */}
          {showBranchModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
                  <button onClick={() => setShowBranchModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleBranchSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      className="input"
                      placeholder="Branch name *"
                      required
                    />
                    <input
                      type="text"
                      value={branchForm.code}
                      onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                      className="input"
                      placeholder="Code (e.g. HQ) *"
                      required
                      disabled={!!editingBranch}
                    />
                  </div>
                  <textarea
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Address"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="input"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      className="input"
                      placeholder="Email"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branchForm.isHeadquarters}
                      onChange={(e) => setBranchForm({ ...branchForm, isHeadquarters: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as Headquarters</span>
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="btn-primary flex-1">
                      {editingBranch ? 'Update' : 'Create'}
                    </button>
                    <button type="button" onClick={() => setShowBranchModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
