'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiEndpoint } from '@/lib/config';
import CalendarioCitas from '@/components/CalendarioCitas';
import UpcomingToday from '@/components/UpcomingToday';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
}

interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  notas?: string;
  paciente: Paciente;
}

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const fetchCitas = async () => {
      try {
        const response = await fetch(apiEndpoint('/citas'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al obtener citas');
        const data = await response.json();
        setCitas(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCitas();
  }, [token]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena" />
            <span className="ml-3 text-marengo">Cargando citas...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-heading font-bold text-concreto">Citas</h1>
            <p className="text-marengo mt-1">Gestión de turnos y citas médicas</p>
          </div>

          {/* Layout: en desktop sidebar + calendario, en móvil apilado */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {/* Widget upcoming — en móvil va arriba, en desktop a la derecha */}
            <div className="w-full lg:w-72 lg:flex-shrink-0 order-first lg:order-last">
              <UpcomingToday citas={citas} />
            </div>

            {/* Calendario — ocupa el resto */}
            <div className="flex-1 min-w-0">
              <CalendarioCitas citas={citas} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}