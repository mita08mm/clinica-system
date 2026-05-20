'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function InventarioPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-concreto">
              Inventario
            </h1>
            <p className="text-marengo mt-1">
              Control de stock y movimientos
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-marengo">
              Modulo de inventario en desarrollo...
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
