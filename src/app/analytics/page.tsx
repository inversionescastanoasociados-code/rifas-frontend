'use client';

import { useEffect, useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { rifaApi } from '@/lib/rifaApi';

type Rifa = {
  id: string;
  nombre: string;
};

export default function Page() {
  const [rifas, setRifas] = useState<Rifa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRifas = async () => {
      try {
        const res = await rifaApi.getRifas();
        setRifas(res.data);
      } catch (error) {
        console.error("Error cargando rifas", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRifas();
  }, []);

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

  return <AnalyticsDashboard rifas={rifas} />;
}