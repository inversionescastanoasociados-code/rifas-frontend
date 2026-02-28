"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { getVentasGeneral } from '../services/analytics.service';

// ─── Helpers ───────────────────────────────────────────
const fmt = (n) => `$${Number(n).toLocaleString('es-CO')}`;
const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const estadoColors = {
  PAGADA: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ABONADA: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  PENDIENTE: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  SIN_REVISAR: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  CANCELADA: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  EXPIRADA: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
};

const estadoLabel = {
  PAGADA: 'Pagada',
  ABONADA: 'Abonada',
  PENDIENTE: 'Pendiente',
  SIN_REVISAR: 'Sin Revisar',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
};

const origenLabel = {
  ONLINE: 'Página Online',
  PUNTO_FISICO: 'Punto Físico',
};

const tipoTransLabel = {
  PAGO_TOTAL: 'Pago Total',
  ABONO: 'Abono Parcial',
  RESERVA: 'Reserva',
  SIN_PAGO: 'Sin Pago',
};

const tipoTransColors = {
  PAGO_TOTAL: 'text-emerald-600 bg-emerald-50',
  ABONO: 'text-purple-600 bg-purple-50',
  RESERVA: 'text-amber-600 bg-amber-50',
  SIN_PAGO: 'text-slate-500 bg-slate-50',
};

// ─── Detalle expandido de una venta ────────────────────
function VentaDetalleExpandido({ venta }) {
  return (
    <tr>
      <td colSpan={8} className="px-0 py-0">
        <div className="bg-slate-50 border-t border-b border-slate-200 px-6 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info del comprador */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-base">👤</span> Información del Comprador
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Nombre</span>
                  <span className="text-sm font-medium text-slate-900">{venta.cliente_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Teléfono</span>
                  <span className="text-sm font-medium text-slate-900">{venta.cliente_telefono || '—'}</span>
                </div>
                {venta.cliente_email && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Email</span>
                    <span className="text-sm font-medium text-slate-900 truncate ml-2">{venta.cliente_email}</span>
                  </div>
                )}
                {venta.cliente_identificacion && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Cédula</span>
                    <span className="text-sm font-medium text-slate-900">{venta.cliente_identificacion}</span>
                  </div>
                )}
                {venta.cliente_direccion && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Dirección</span>
                    <span className="text-sm font-medium text-slate-900 truncate ml-2">{venta.cliente_direccion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info de la venta */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-base">🛒</span> Detalle de la Venta
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Monto Total</span>
                  <span className="text-sm font-bold text-slate-900">{fmt(venta.monto_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Total Pagado</span>
                  <span className="text-sm font-bold text-emerald-600">{fmt(venta.total_pagado_real)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Saldo Pendiente</span>
                  <span className={`text-sm font-bold ${venta.saldo_pendiente > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {fmt(venta.saldo_pendiente)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Precio Boleta</span>
                  <span className="text-sm font-medium text-slate-900">{fmt(venta.precio_boleta)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Tipo</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoTransColors[venta.tipo_transaccion] || 'text-slate-500 bg-slate-50'}`}>
                    {tipoTransLabel[venta.tipo_transaccion] || venta.tipo_transaccion}
                  </span>
                </div>
                {venta.vendedor_nombre && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Vendedor</span>
                    <span className="text-sm font-medium text-slate-900">{venta.vendedor_nombre}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Boletas */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="text-base">🎟️</span> Boletas ({venta.cantidad_boletas})
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {venta.numeros_boletas && venta.numeros_boletas.map((num, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200"
                  >
                    #{String(num).padStart(4, '0')}
                  </span>
                ))}
              </div>
              {venta.notas_admin && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Notas:</span>
                  <p className="text-xs text-slate-600 mt-0.5">{venta.notas_admin}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Componente Principal ──────────────────────────────
export default function VentasGeneralModal({ 
  isOpen, 
  onClose, 
  rifaId, 
  fechaInicio, 
  fechaFin,
  rifaNombre 
}) {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  // Filtros locales
  const [filtroOrigen, setFiltroOrigen] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!isOpen || !rifaId) return;
    fetchVentas();
  }, [isOpen, rifaId, fechaInicio, fechaFin, page]);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const data = await getVentasGeneral(rifaId, fechaInicio, fechaFin, page, 100);
      setVentas(data.ventas || []);
      setResumen(data.resumen || null);
      setPaginacion(data.paginacion || null);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar localmente
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      if (filtroOrigen !== 'TODOS' && v.origen_venta !== filtroOrigen) return false;
      if (filtroEstado !== 'TODOS' && v.estado_venta !== filtroEstado) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchNombre = v.cliente_nombre?.toLowerCase().includes(q);
        const matchTel = v.cliente_telefono?.includes(q);
        const matchCedula = v.cliente_identificacion?.includes(q);
        const matchBoleta = v.numeros_boletas?.some(n => String(n).includes(q));
        if (!matchNombre && !matchTel && !matchCedula && !matchBoleta) return false;
      }
      return true;
    });
  }, [ventas, filtroOrigen, filtroEstado, busqueda]);

  // Periodo label
  const periodoLabel = useMemo(() => {
    if (!fechaInicio && !fechaFin) return 'Todo el historial';
    if (fechaInicio === fechaFin) return `${fechaInicio}`;
    return `${fechaInicio} → ${fechaFin}`;
  }, [fechaInicio, fechaFin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-7xl mx-4 my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              Ventas Realizadas
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {rifaNombre} — {periodoLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumen Cards */}
        {resumen && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-400 font-medium">Total Ventas</p>
                <p className="text-xl font-bold text-slate-900">{resumen.total_ventas}</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 p-3 text-center">
                <p className="text-xs text-emerald-500 font-medium">Pagadas</p>
                <p className="text-xl font-bold text-emerald-600">{resumen.ventas_pagadas}</p>
              </div>
              <div className="bg-white rounded-xl border border-purple-200 p-3 text-center">
                <p className="text-xs text-purple-500 font-medium">Abonadas</p>
                <p className="text-xl font-bold text-purple-600">{resumen.ventas_abonadas}</p>
              </div>
              <div className="bg-white rounded-xl border border-amber-200 p-3 text-center">
                <p className="text-xs text-amber-500 font-medium">Pendientes</p>
                <p className="text-xl font-bold text-amber-600">{resumen.ventas_pendientes}</p>
              </div>
              <div className="bg-white rounded-xl border border-blue-200 p-3 text-center">
                <p className="text-xs text-blue-500 font-medium">🌐 Online</p>
                <p className="text-xl font-bold text-blue-600">{resumen.ventas_online}</p>
              </div>
              <div className="bg-white rounded-xl border border-orange-200 p-3 text-center">
                <p className="text-xs text-orange-500 font-medium">🏪 P. Físico</p>
                <p className="text-xl font-bold text-orange-600">{resumen.ventas_punto_fisico}</p>
              </div>
            </div>

            {/* Montos totales */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-xs text-slate-400 font-medium">Monto Total</p>
                <p className="text-lg font-bold text-slate-900">{fmt(resumen.monto_total)}</p>
              </div>
              <div className="bg-white rounded-xl border border-emerald-200 p-3 text-center">
                <p className="text-xs text-emerald-500 font-medium">Total Abonado</p>
                <p className="text-lg font-bold text-emerald-600">{fmt(resumen.total_abonado)}</p>
              </div>
              <div className="bg-white rounded-xl border border-rose-200 p-3 text-center">
                <p className="text-xs text-rose-500 font-medium">Saldo Pendiente</p>
                <p className="text-lg font-bold text-rose-600">{fmt(resumen.saldo_pendiente_total)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, cédula o # boleta..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50"
            />
          </div>

          {/* Filtro Origen */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['TODOS', 'ONLINE', 'PUNTO_FISICO'].map(opt => (
              <button
                key={opt}
                onClick={() => setFiltroOrigen(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filtroOrigen === opt 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt === 'TODOS' ? 'Todos' : opt === 'ONLINE' ? '🌐 Online' : '🏪 Físico'}
              </button>
            ))}
          </div>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PAGADA">✅ Pagada</option>
            <option value="ABONADA">💳 Abonada</option>
            <option value="PENDIENTE">⏳ Pendiente</option>
            <option value="SIN_REVISAR">🔍 Sin Revisar</option>
            <option value="CANCELADA">❌ Cancelada</option>
            <option value="EXPIRADA">⏰ Expirada</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto">
            {ventasFiltradas.length} de {ventas.length} ventas
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-slate-500">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cargando ventas...
              </div>
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-4xl mb-3">📭</span>
              <p className="font-medium">No se encontraron ventas</p>
              <p className="text-sm mt-1">Ajusta los filtros o el periodo de búsqueda</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Comprador</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Origen</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Boletas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventasFiltradas.map((venta) => {
                  const ec = estadoColors[venta.estado_venta] || estadoColors.EXPIRADA;
                  const isExpanded = expandedId === venta.id;

                  return (
                    <React.Fragment key={venta.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : venta.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-slate-900 font-medium text-xs">{fmtDate(venta.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-slate-900 font-medium">{venta.cliente_nombre}</p>
                            <p className="text-xs text-slate-400">{venta.cliente_telefono}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            venta.origen_venta === 'ONLINE' 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-orange-50 text-orange-600 border border-orange-200'
                          }`}>
                            {venta.origen_venta === 'ONLINE' ? '🌐' : '🏪'} {origenLabel[venta.origen_venta]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-bold text-blue-600">{venta.cantidad_boletas}</span>
                            <span className="text-xs text-slate-400">bol.</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-slate-900">{fmt(venta.monto_total)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-600">{fmt(venta.total_pagado_real)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ec.bg} ${ec.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                            {estadoLabel[venta.estado_venta] || venta.estado_venta}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${tipoTransColors[venta.tipo_transaccion] || 'text-slate-500 bg-slate-50'}`}>
                            {tipoTransLabel[venta.tipo_transaccion] || venta.tipo_transaccion}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && <VentaDetalleExpandido venta={venta} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {paginacion && paginacion.total_pages > 1 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Página {paginacion.page} de {paginacion.total_pages} ({paginacion.total} ventas total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(paginacion.total_pages, p + 1))}
                disabled={page >= paginacion.total_pages}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
