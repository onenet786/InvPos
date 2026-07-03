import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  ClipboardList,
  Receipt,
  Users,
  BarChart3,
  UserCog,
  ScrollText,
  LogOut,
  Store,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'inventory_staff'] },
  { to: '/pos', label: 'POS Terminal', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'manager', 'inventory_staff'] },
  { to: '/stock', label: 'Stock', icon: Warehouse, roles: ['admin', 'manager', 'inventory_staff'] },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'manager', 'inventory_staff'] },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList, roles: ['admin', 'manager', 'inventory_staff'] },
  { to: '/sales', label: 'Sales History', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary-400" />
            <span className="text-lg font-bold">InvPos</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.Role?.name?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
