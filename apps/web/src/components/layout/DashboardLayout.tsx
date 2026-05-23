'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import PersonIcon from '../icons/PersonIcon';
import AppointmentIcon from '../icons/AppointmentIcon';
import MoneyIcon from '../icons/MoneyIcon';
import PrescriptionIcon from '../icons/PrescriptionIcon';
import InventoryIcon from '../icons/InventoryIcon';
import LogoutIcon from '../icons/LogoutIcon';

const menuItems = [
  { href: '/pacientes', label: 'Pacientes', icon: <PersonIcon className="w-[18px] h-[18px]" /> },
  { href: '/citas', label: 'Citas', icon: <AppointmentIcon className="w-[18px] h-[18px]" /> },
  { href: '/cobros', label: 'Cobros', icon: <MoneyIcon className="w-[18px] h-[18px]" /> },
  { href: '/recetas', label: 'Prescripciones', icon: <PrescriptionIcon className="w-[18px] h-[18px]" /> },
  { href: '/inventario', label: 'Inventario', icon: <InventoryIcon className="w-[18px] h-[18px]" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const initials =
    `${usuario?.nombre?.[0] ?? ''}${usuario?.nombre?.split(' ')[1]?.[0] ?? ''}`.toUpperCase() || 'U';

  const renderBrand = () => (
    <div className="px-5 pt-6 pb-5">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-md bg-[var(--brand-morena)] text-white font-heading text-sm font-medium flex items-center justify-center">
          C
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm font-medium text-[var(--neutral-900)] leading-tight">
            Clínica
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--neutral-500)] leading-tight mt-0.5">
            Sistema médico
          </p>
        </div>
      </div>
    </div>
  );

  const renderNav = () => (
    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
      <p className="overline px-3 mb-2 mt-1">Menú</p>
      {menuItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={`sidebar-nav-item ${active ? 'active' : ''}`}
          >
            <span className={active ? 'text-[var(--brand-morena)]' : 'text-[var(--neutral-500)]'}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderUser = () => (
    <div className="border-t border-[var(--neutral-200)] px-4 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-[rgba(204,175,125,0.22)] text-[var(--brand-morena)] text-xs font-semibold flex items-center justify-center">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--neutral-800)] truncate">{usuario?.nombre}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--neutral-500)]">
            {usuario?.rol ?? 'Usuario'}
          </p>
        </div>
      </div>
      <button
        onClick={logout}
        className="w-full inline-flex items-center justify-center gap-2 h-8 px-3 rounded-md text-xs font-medium text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--semantic-danger)] transition-colors"
      >
        <LogoutIcon className="w-4 h-4" />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--neutral-25)]">
      {/* Sidebar desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex md:flex-col bg-white border-r border-[var(--neutral-200)]">
        {renderBrand()}
        {renderNav()}
        {renderUser()}
      </aside>

      {/* Header mobile */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-[var(--neutral-200)]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-[var(--brand-morena)] text-white font-heading text-xs font-medium flex items-center justify-center">
            C
          </div>
          <h1 className="font-heading text-sm font-medium text-[var(--neutral-900)]">Clínica</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-md text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Overlay mobile */}
      <div
        onClick={close}
        className={`md:hidden fixed inset-0 z-40 bg-[rgba(31,31,31,0.4)] transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar mobile */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-white border-r border-[var(--neutral-200)] transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={close}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 p-1.5 rounded-md text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {renderBrand()}
        {renderNav()}
        {renderUser()}
      </aside>

      <div className="md:ml-60">
        <main className="p-4 md:p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
