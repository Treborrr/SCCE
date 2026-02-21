import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DashboardService {
    constructor(@Inject('PG_POOL') private pool: Pool) { }

    async obtenerEstadisticas() {
        const client = await this.pool.connect();

        try {
            // KPIs principales
            const totalLotes = await client.query(`SELECT COUNT(*) FROM lotes`);
            const lotesActivos = await client.query(`SELECT COUNT(*) FROM lotes WHERE estado NOT IN ('INGRESADO')`);
            const stockAlmacen = await client.query(`SELECT COALESCE(SUM(stock_actual), 0) as total FROM lotes WHERE estado = 'ALMACEN'`);
            const stockDerivados = await client.query(`SELECT COALESCE(SUM(stock_actual), 0) as total FROM lotes_derivados`);
            const totalMuestras = await client.query(`SELECT COUNT(*) FROM muestras`);
            const totalAnalisis = await client.query(`SELECT COUNT(*) FROM analisis_fisicos`);
            const totalCatas = await client.query(`SELECT COUNT(*) FROM catas`);
            const totalProveedores = await client.query(`SELECT COUNT(DISTINCT proveedor_nombre) FROM lotes`);

            // Lotes por estado (para gráfico de dona)
            const lotesPorEstado = await client.query(`
        SELECT estado, COUNT(*) as cantidad
        FROM lotes
        GROUP BY estado
        ORDER BY cantidad DESC
      `);

            // Kg comprados por mes (últimos 6 meses)
            const kgPorMes = await client.query(`
        SELECT 
          TO_CHAR(fecha_compra, 'YYYY-MM') as mes,
          TO_CHAR(fecha_compra, 'Mon') as mes_label,
          COALESCE(SUM(kg_baba_compra), 0) as kg_baba,
          COUNT(*) as lotes
        FROM lotes
        WHERE fecha_compra >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(fecha_compra, 'YYYY-MM'), TO_CHAR(fecha_compra, 'Mon')
        ORDER BY mes
      `);

            // Top 5 proveedores por kg
            const topProveedores = await client.query(`
        SELECT 
          proveedor_nombre,
          COUNT(*) as total_lotes,
          COALESCE(SUM(kg_baba_compra), 0) as total_kg
        FROM lotes
        GROUP BY proveedor_nombre
        ORDER BY total_kg DESC
        LIMIT 5
      `);

            // Rendimiento promedio por proveedor
            const rendimiento = await client.query(`
        SELECT 
          l.proveedor_nombre,
          ROUND(AVG(
            CASE WHEN l.kg_baba_compra > 0 
              THEN (l.stock_actual / l.kg_baba_compra * 100) 
              ELSE 0 
            END
          ), 1) as rendimiento_promedio
        FROM lotes l
        WHERE l.estado = 'ALMACEN' AND l.kg_baba_compra > 0
        GROUP BY l.proveedor_nombre
        ORDER BY rendimiento_promedio DESC
        LIMIT 5
      `);

            // Lotes recientes
            const lotesRecientes = await client.query(`
        SELECT id, codigo, proveedor_nombre, estado, kg_baba_compra, stock_actual, fecha_compra
        FROM lotes
        ORDER BY created_at DESC
        LIMIT 8
      `);

            // Actividad reciente (últimos eventos)
            const actividad = await client.query(`
        SELECT 
          'FERMENTACION' as tipo,
          ef.tipo as detalle,
          l.codigo as lote_codigo,
          ef.fecha as fecha
        FROM fermentacion_eventos ef
        JOIN lotes l ON l.id = ef.lote_id
        ORDER BY ef.created_at DESC
        LIMIT 5
      `);

            return {
                kpis: {
                    total_lotes: Number(totalLotes.rows[0].count),
                    lotes_activos: Number(lotesActivos.rows[0].count),
                    stock_almacen_kg: Number(stockAlmacen.rows[0].total),
                    stock_derivados_kg: Number(stockDerivados.rows[0].total),
                    total_muestras: Number(totalMuestras.rows[0].count),
                    total_analisis: Number(totalAnalisis.rows[0].count),
                    total_catas: Number(totalCatas.rows[0].count),
                    total_proveedores: Number(totalProveedores.rows[0].count),
                },
                lotes_por_estado: lotesPorEstado.rows,
                kg_por_mes: kgPorMes.rows,
                top_proveedores: topProveedores.rows,
                rendimiento: rendimiento.rows,
                lotes_recientes: lotesRecientes.rows,
                actividad: actividad.rows,
            };
        } finally {
            client.release();
        }
    }
}
