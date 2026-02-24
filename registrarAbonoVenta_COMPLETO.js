// ========== COPIAR Y REEMPLAZAR LA FUNCIÓN COMPLETA registrarAbonoVenta EN ventas.service.js ==========

async registrarAbonoVenta(ventaId, monto, medioPagoId, moneda, userId, notas) {
  const tx = await beginTransaction();

  try {
    // 1) Verificar que la venta existe
    const ventaResult = await tx.query(
      `SELECT * FROM ventas WHERE id = $1 FOR UPDATE`,
      [ventaId]
    );

    if (ventaResult.rows.length === 0) {
      throw new Error('Venta no encontrada');
    }

    const venta = ventaResult.rows[0];
    const montoTotal = Number(venta.monto_total || 0);

    // 2) Calcular total pagado actual
    const abonosActualesResult = await tx.query(
      `SELECT COALESCE(SUM(monto), 0) as total_pagado
       FROM abonos WHERE venta_id = $1`,
      [ventaId]
    );
    const totalPagadoActual = Number(abonosActualesResult.rows[0].total_pagado);
    const saldoPendienteActual = montoTotal - totalPagadoActual;

    if (saldoPendienteActual <= 0) {
      throw new Error('La venta ya está pagada');
    }

    if (monto > saldoPendienteActual) {
      throw new Error('El monto excede el saldo pendiente');
    }

    // 3) Obtener boletas de la venta
    const boletasResult = await tx.query(
      `SELECT id FROM boletas WHERE venta_id = $1`,
      [ventaId]
    );

    if (boletasResult.rows.length === 0) {
      throw new Error('La venta no tiene boletas asociadas');
    }

    const boletas = boletasResult.rows;
    const cantidadBoletas = boletas.length;
    const montoPorBoleta = monto / cantidadBoletas;

    // 4) Crear abonos (uno por cada boleta)
    for (const boleta of boletas) {
      await tx.query(
        `INSERT INTO abonos (
          venta_id,
          boleta_id,
          monto,
          estado,
          medio_pago_id,
          moneda,
          registrado_por,
          notas,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          ventaId,
          boleta.id,
          montoPorBoleta,
          'CONFIRMADO',
          medioPagoId,
          moneda || 'COP',
          userId,
          notas || null
        ]
      );
    }

    // 5) Calcular nuevos totales
    const nuevoTotalPagado = totalPagadoActual + monto;
    const nuevoSaldo = montoTotal - nuevoTotalPagado;

    let nuevoEstado = 'ABONADA';
    if (nuevoSaldo <= 0) {
      nuevoEstado = 'PAGADA';
    }

    // 6) Actualizar venta (abono_total; saldo_pendiente es columna generada y no se actualiza)
    await tx.query(
      `UPDATE ventas 
       SET abono_total = $1, 
           estado_venta = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nuevoTotalPagado, nuevoEstado, ventaId]
    );

    // 7) Actualizar estado de boletas
    const estadoBoleta = nuevoEstado === 'PAGADA' ? 'PAGADA' : 'ABONADA';
    await tx.query(
      `UPDATE boletas 
       SET estado = $1, updated_at = CURRENT_TIMESTAMP
       WHERE venta_id = $2`,
      [estadoBoleta, ventaId]
    );

    await tx.commit();

    // 8) Retornar venta actualizada
    const ventaActualizadaResult = await query(
      `SELECT * FROM ventas WHERE id = $1`,
      [ventaId]
    );

    return ventaActualizadaResult.rows[0];

  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
