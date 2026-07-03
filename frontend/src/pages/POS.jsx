import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Pause,
  Play,
  X,
  DollarSign,
  CreditCard,
  Smartphone,
  Receipt,
  Loader2,
  Flame,
  Package,
} from 'lucide-react';

export default function POS() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [heldSales, setHeldSales] = useState([]);
  const [showHeld, setShowHeld] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [topProducts, setTopProducts] = useState([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const searchRef = useRef(null);

  const debouncedSearch = useRef(null);

  useEffect(() => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const { data } = await api.get(`/products/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(data.data || []);
        } catch {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(debouncedSearch.current);
  }, [searchQuery]);

  useEffect(() => {
    searchRef.current?.focus();
    setLoadingTop(true);
    api.get('/products/top-selling?limit=15')
      .then(({ data }) => setTopProducts(data.data || []))
      .catch(() => setTopProducts([]))
      .finally(() => setLoadingTop(false));
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: parseFloat(product.salePrice),
          costPrice: parseFloat(product.costPrice),
          taxRate: parseFloat(product.taxRate || 0),
          quantity: 1,
          discount: 0,
        },
      ];
    });
    setSearchQuery('');
    setSearchResults([]);
    searchRef.current?.focus();
  }, []);

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateItemDiscount = (productId, discount) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, discount: parseFloat(discount) || 0 } : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const afterItemDiscount = subtotal - itemDiscounts;
  const cartDiscountAmount = discountType === 'percentage' ? (afterItemDiscount * cartDiscount) / 100 : cartDiscount;
  const afterDiscount = afterItemDiscount - cartDiscountAmount;
  const tax = cart.reduce((sum, item) => {
    const itemSub = item.unitPrice * item.quantity - item.discount;
    return sum + (itemSub * item.taxRate) / 100;
  }, 0);
  const total = afterDiscount + tax;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const { data } = await api.post('/sales', {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        payments: payments.filter((p) => p.amount > 0),
        customerId: customer?.id,
        discount: cartDiscountAmount,
        discountType,
      });
      setReceipt(data.sale);
      setCart([]);
      setCartDiscount(0);
      setCustomer(null);
      setShowPayment(false);
      setPayments([{ method: 'cash', amount: 0 }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      await api.post('/sales/hold', {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        customerId: customer?.id,
        discount: cartDiscountAmount,
        discountType,
      });
      setCart([]);
      setCustomer(null);
      setCartDiscount(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Hold failed');
    } finally {
      setLoading(false);
    }
  };

  const loadHeldSales = async () => {
    try {
      const { data } = await api.get('/sales?status=held');
      setHeldSales(data.data || []);
      setShowHeld(true);
    } catch {
      // ignore
    }
  };

  const resumeSale = async (saleId) => {
    try {
      const { data } = await api.get(`/sales/${saleId}`);
      const sale = data.sale;
      setCart(
        sale.items.map((item) => ({
          productId: item.productId,
          name: item.Product.name,
          sku: item.Product.sku,
          unitPrice: parseFloat(item.unitPrice),
          costPrice: parseFloat(item.costPrice),
          taxRate: parseFloat(item.taxRate) / item.quantity * 100,
          quantity: item.quantity,
          discount: parseFloat(item.discount),
        }))
      );
      setCustomer(sale.Customer);
      setCartDiscount(parseFloat(sale.discount));
      setShowHeld(false);
    } catch {
      // ignore
    }
  };

  const searchCustomers = async (query) => {
    setCustomerSearch(query);
    if (query.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/customers?search=${encodeURIComponent(query)}`);
      setCustomerResults(data.data || []);
    } catch {
      setCustomerResults([]);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const change = totalPaid - total;

  return (
    <div className="flex h-full">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 text-lg"
              placeholder="Scan barcode or search product..."
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 border-b border-gray-100 last:border-0 text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku} | {product.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">${parseFloat(product.salePrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.Stock?.[0]?.quantity || 0}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Hot / Most Selling Items — shown when no search active */}
          {searchQuery.trim() === '' && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-700">Hot / Most Selling Items</h3>
                {loadingTop && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
              </div>
              {topProducts.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {topProducts.map((product, idx) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group relative bg-white border border-gray-200 rounded-xl p-3 hover:border-primary-400 hover:shadow-md transition-all text-left flex flex-col items-center justify-between min-h-[110px]"
                    >
                      {idx < 3 && (
                        <span className={`absolute -top-2 -left-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-orange-400' : 'bg-orange-300'}`}>
                          {idx + 1}
                        </span>
                      )}
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-1.5">
                        <Package className="w-5 h-5 text-primary-500" />
                      </div>
                      <p className="text-xs font-medium text-gray-800 text-center line-clamp-2 leading-tight">{product.name}</p>
                      <div className="w-full flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-primary-600">${parseFloat(product.salePrice).toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400">{product.totalSold} sold</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !loadingTop ? (
                <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  <Flame className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No sales data yet. Hot items will appear here after sales are made.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-3" />
              <p>Cart is empty. Scan or search products to begin.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header text-center">Qty</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-right">Disc</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <tr key={item.productId}>
                    <td className="table-cell">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="table-cell text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="table-cell text-right">
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItemDiscount(item.productId, e.target.value)}
                        className="w-16 px-1 py-1 text-right border border-gray-200 rounded text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="table-cell text-right font-medium">
                      ${(item.unitPrice * item.quantity - item.discount).toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: Summary & Checkout */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col p-4 overflow-y-auto">
        {/* Customer */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Customer</label>
          {customer ? (
            <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
              <span className="text-sm font-medium">{customer.name}</span>
              <button onClick={() => setCustomer(null)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => searchCustomers(e.target.value)}
                className="input"
                placeholder="Search customer..."
              />
              {customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone} | Points: {c.loyaltyPoints}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discount */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Cart Discount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={cartDiscount || ''}
              onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
              className="input flex-1"
              placeholder="0"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="input w-24"
            >
              <option value="amount">$</option>
              <option value="percentage">%</option>
            </select>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 py-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          {itemDiscounts > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item Discounts</span>
              <span className="font-medium text-red-600">-${itemDiscounts.toFixed(2)}</span>
            </div>
          )}
          {cartDiscountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cart Discount</span>
              <span className="font-medium text-red-600">-${cartDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-primary-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

        {/* Actions */}
        <div className="space-y-2 mt-auto">
          <button
            onClick={() => setShowPayment(true)}
            disabled={!cart.length || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
          >
            <DollarSign className="w-5 h-5" />
            Checkout (${total.toFixed(2)})
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleHold}
              disabled={!cart.length || loading}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Hold
            </button>
            <button
              onClick={loadHeldSales}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Payment</h2>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-primary-50 rounded-xl">
              <div className="flex justify-between text-2xl font-bold">
                <span>Total Due</span>
                <span className="text-primary-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {payments.map((payment, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={payment.method}
                    onChange={(e) => {
                      setPayments((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, method: e.target.value } : p))
                      );
                    }}
                    className="input w-36"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_wallet">Mobile Wallet</option>
                    <option value="credit">Credit</option>
                  </select>
                  <input
                    type="number"
                    value={payment.amount || ''}
                    onChange={(e) => {
                      setPayments((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, amount: parseFloat(e.target.value) || 0 } : p))
                      );
                    }}
                    className="input flex-1"
                    placeholder="Amount"
                    autoFocus={idx === 0}
                  />
                  {payments.length > 1 && (
                    <button
                      onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPayments((prev) => [...prev, { method: 'cash', amount: 0 }])}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add split payment
              </button>
            </div>

            <div className="space-y-2 py-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-medium">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Change</span>
                <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${Math.abs(change).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || totalPaid < total}
              className="btn-success w-full flex items-center justify-center gap-2 py-3 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
              Complete Sale
            </button>
          </div>
        </div>
      )}

      {/* Held Sales Modal */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Held Transactions</h2>
              <button onClick={() => setShowHeld(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {heldSales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No held transactions</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {heldSales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => resumeSale(sale.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-primary-50"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{sale.saleNumber}</span>
                      <span className="font-bold text-primary-600">${parseFloat(sale.total).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.heldAt).toLocaleString()} | {sale.items?.length || 0} items
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Sale Complete</h2>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 py-4 my-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Receipt #</span>
                <span className="font-medium">{receipt.saleNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">${parseFloat(receipt.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium">${parseFloat(receipt.paidAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change</span>
                <span className="font-medium">${parseFloat(receipt.changeAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {receipt.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.Product?.name}</span>
                  <span>${parseFloat(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => window.print()} className="btn-secondary flex-1">
                Print
              </button>
              <button onClick={() => setReceipt(null)} className="btn-primary flex-1">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
