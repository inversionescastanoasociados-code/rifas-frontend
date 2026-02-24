"use client";

import { useEffect, useState } from "react";
import { getReporteRifa } from "./services/analytics.service";
import FiltersBar from "./components/FiltersBar";
import KPISection from "./components/KPISection";
import MethodsChart from "./components/MethodsChart";
import TicketsChart from "./components/TicketsChart";
import { useRouter } from "next/navigation";

/* =======================
   TIPOS
======================= */
type Rifa = {
  id: string;
  nombre: string;
};

type Props = {
  rifas: Rifa[];
};

export default function AnalyticsDashboard({ rifas }: Props) {
  const router = useRouter();

  const onBack = () => {
    router.push('/dashboard');
  };

  const [selectedRifa, setSelectedRifa] = useState<string | null>(
    rifas.length ? rifas[0].id : null
  );

  // Por defecto mostrar datos de HOY (si no hay ventas hoy, todo sale en cero)
  const hoy = new Date().toISOString().split("T")[0]; // "2026-02-24"
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRifa) return;

    const fetchData = async () => {
      setLoading(true);
      const result = await getReporteRifa(
        selectedRifa,
        fechaInicio,
        fechaFin
      );
      setData(result);
      setLoading(false);
    };

    fetchData();
  }, [selectedRifa, fechaInicio, fechaFin]);

  if (!rifas.length) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500">No hay rifas disponibles</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                title="Volver al Dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-light text-slate-900">Análisis de Rifas</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FiltersBar
          rifas={rifas}
          selectedRifa={selectedRifa}
          setSelectedRifa={setSelectedRifa}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          setFechaInicio={setFechaInicio}
          setFechaFin={setFechaFin}
        />

        {loading && !data ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-slate-400 animate-pulse font-light text-lg">Procesando métricas...</div>
          </div>
        ) : data ? (
          <div className={`space-y-6 ${loading ? 'opacity-50 pointer-events-none' : 'transition-opacity duration-300'}`}>
            <KPISection data={data} fechaInicio={fechaInicio} fechaFin={fechaFin} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MethodsChart methods={data.metodos_pago} serieDiaria={data.serie_diaria} fechaInicio={fechaInicio} fechaFin={fechaFin} />
              <TicketsChart resumen={data.resumen_boletas} boletasPeriodo={data.boletas_periodo} hayFiltro={!!(fechaInicio && fechaFin)} />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}