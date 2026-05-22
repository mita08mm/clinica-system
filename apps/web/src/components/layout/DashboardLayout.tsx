'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PersonIcon from '../icons/PersonIcon';
import AppointmentIcon from '../icons/AppointmentIcon';
import MoneyIcon from '../icons/MoneyIcon';
import PrescriptionIcon from '../icons/PrescriptionIcon';
import InventoryIcon from '../icons/InventoryIcon';
import LogoutIcon from '../icons/LogoutIcon';

const menuItems = [
  { href: '/pacientes', label: 'Pacientes', icon: <PersonIcon className="w-6 h-6" /> },
  { href: '/citas', label: 'Citas', icon: <AppointmentIcon className="w-6 h-6" /> },
  { href: '/cobros', label: 'Cobros', icon: <MoneyIcon className="w-6 h-6" /> },
  { href: '/recetas', label: 'Recetas', icon: <PrescriptionIcon className="w-6 h-6" /> },
  { href: '/inventario', label: 'Inventario', icon: <InventoryIcon className="w-6 h-6" /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FBF9F8]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 sidebar flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <h1 className="text-xl font-heading font-bold text-concreto">
            Sistema Clinico
          </h1>
          <p className="text-sm text-marengo mt-1">{usuario?.nombre}</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${
                  isActive ? 'active' : ''
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-heading">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-2 py-2
                      text-[#50453B] hover:opacity-70 transition-all"
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}