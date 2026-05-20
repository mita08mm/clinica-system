'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/pacientes', label: 'Pacientes', icon: '👤' },
  { href: '/citas', label: 'Citas', icon: '📅' },
  { href: '/cobros', label: 'Cobros', icon: '💰' },
  { href: '/recetas', label: 'Recetas', icon: '💊' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
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
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#FEF4E4] text-[#5A350F] border-l-4 border-[#5A350F]'
                    : 'text-marengo hover:bg-piel/10 hover:text-morena'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-heading text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 
                     rounded-lg transition-colors"
          >
            Cerrar Sesion
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
