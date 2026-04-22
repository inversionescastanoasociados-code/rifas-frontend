'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import { rifaApi } from '@/lib/rifaApi';

type Rifa = {
  id: string;
  nombre: string;
};

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VENDEDOR'];

export default function MisReportesPage() {
  const router = useRouter();
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [accesoDenegado, setAccesoDenegado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const role = (user?.rol || '').toUpperCase();
      if (!ALLOWED_ROLES.includes(role)) {
        setAccesoDenegado(true);
        setLoading(false);
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    const fetchRifas = async () => {
      try {
        const res = await rifaApi.getRifas();
        setRifas(res.data);
      } catch (error) {
        console.error('Error cargando rifas', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRifas();
  }, [router]);

  if (accesoDenegado) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 mb-6">Este módulo no está disponible para tu rol.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500 font-light">Cargando módulo...</div>
    </div>
  );

  if (!rifas.length) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
      No hay rifas configuradas en el sistema.
    </div>
  );

  return (
    <AnalyticsDashboard
      rifas={rifas}
      scope="mis-ventas"
      title="Mis Reportes"
    />
  );
}
