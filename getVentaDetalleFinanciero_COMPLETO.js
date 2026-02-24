// ========== COPIAR Y REEMPLAZAR LA FUNCIÓN COMPLETA getVentaDetalleFinanciero EN ventas.service.js ==========
// (Usa totalPagado, NUNCA totalPagadoActual; esa variable es solo de registrarAbonoVenta)

async getVentaDetalleFinanciero(id) {
  // 1) Venta + cliente
  const ventaResult = await query(
    `SELECT v.*, c.nombre, c.telefono
     FROM ventas v
     JOIN clientes c ON v.cliente_id = c.id
     WHERE v.id = $1`,
    [id]
  );

  if (ventaResult.rows.length === 0)
    throw new Error('Venta not found');

  const venta = ventaResult.rows[0];

  // 2) Todos los abonos de la venta, incluyendo número de boleta
  const abonosResult = await query(
    `SELECT a.*, b.numero AS boleta_numero
     FROM abonos a
     JOIN boletas b ON a.boleta_id = b.id
     WHERE a.venta_id = $1
     ORDER BY a.created_at ASC`,
    [id]
  );

  const abonos = abonosResult.rows;

  const totalPagado = abonos.reduce(
    (sum, a) => sum + Number(a.monto),
    0
  );

  const montoTotal = Number(venta.monto_total);
  const saldoPendienteTotal = Math.max(montoTotal - totalPagado, 0);

  // 3) Boletas de esta venta (incluyendo numero y bloqueo_hasta)
  const boletasResult = await query(
    `SELECT id, numero, estado, bloqueo_hasta
     FROM boletas
     WHERE venta_id = $1
     ORDER BY numero ASC`,
    [id]
  );

  const boletas = boletasResult.rows;

  if (boletas.length === 0) {
    throw new Error("Venta sin boletas asociadas");
  }

  const cantidadBoletas = boletas.length;
  const precioBoleta = montoTotal / cantidadBoletas;

  // 4) Agrupar abonos por boleta para calcular pagado/saldo por boleta
  const abonosPorBoleta = new Map();

  for (const abono of abonos) {
    const boletaId = abono.boleta_id;
    const monto = Number(abono.monto);

    if (!abonosPorBoleta.has(boletaId)) {
      abonosPorBoleta.set(boletaId, 0);
    }

    abonosPorBoleta.set(
      boletaId,
      abonosPorBoleta.get(boletaId) + monto
    );
  }

  const boletasConFinanzas = boletas.map((b) => {
    const pagadoBoleta = Number(abonosPorBoleta.get(b.id) || 0);
    const saldoBoleta = Math.max(precioBoleta - pagadoBoleta, 0);

    return {
      ...b,
      precio_boleta: precioBoleta,
      total_pagado_boleta: pagadoBoleta,
      saldo_pendiente_boleta: saldoBoleta
    };
  });

  // 5) Devolver todo listo para el frontend (módulo Gestionar)
  return {
    ...venta,
    nombre: venta.nombre,
    telefono: venta.telefono,
    total_pagado: totalPagado,
    saldo_pendiente: saldoPendienteTotal,
    abonos,
    boletas: boletasConFinanzas
  };
}
