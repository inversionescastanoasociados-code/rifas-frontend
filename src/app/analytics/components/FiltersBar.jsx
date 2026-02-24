"use client";
import React from 'react';

export default function FiltersBar({
  rifas,
  selectedRifa,
  setSelectedRifa,
  fechaInicio,
  fechaFin,
  setFechaInicio,
  setFechaFin,
}) {
  const hoy = new Date().toISOString().split('T')[0];

  // Detectar qué preset está activo
  const isPresetTodo = !fechaInicio && !fechaFin;
  const isPresetHoy = fechaInicio === hoy && fechaFin === hoy;

  const getDaysAgoDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const isPreset7 = fechaInicio === getDaysAgoDate(7) && fechaFin === hoy;
  const isPreset30 = fechaInicio === getDaysAgoDate(30) && fechaFin === hoy;
  const isCustomRange = !isPresetTodo && !isPresetHoy && !isPreset7 && !isPreset30;

  // Función para filtros rápidos de fecha
  const setDatePreset = (days) => {
    if (days === null) {
      setFechaInicio('');
      setFechaFin('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFechaFin(end.toISOString().split('T')[0]);
    setFechaInicio(start.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Selector de Rifa (Estilo Premium) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-500">Rifa seleccionada</label>
        <div className="relative">
          <select
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-base font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full md:w-80 px-4 py-2.5 outline-none cursor-pointer transition-all"
            value={selectedRifa || ''}
            onChange={(e) => setSelectedRifa(e.target.value)}
          >
            {rifas.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filtros de Fecha Ergonómicos */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-500">Periodo</label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setDatePreset(null)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${isPresetTodo ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todo
            </button>
            <button 
              onClick={() => setDatePreset(0)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${isPresetHoy ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setDatePreset(7)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${isPreset7 ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              7 Días
            </button>
            <button 
              onClick={() => setDatePreset(30)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${isPreset30 ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              30 Días
            </button>
          </div>

          {/* Calendarios nativos opcionales y discretos */}
          <div className="flex items-center gap-2 ml-2">
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)} 
              className="bg-transparent border-none text-slate-500 text-sm focus:ring-0 cursor-pointer outline-none"
              title="Fecha inicio"
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)} 
              className="bg-transparent border-none text-slate-500 text-sm focus:ring-0 cursor-pointer outline-none"
              title="Fecha fin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}