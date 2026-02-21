import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    obtenerEstadisticas(): Promise<{
        kpis: {
            total_lotes: number;
            lotes_activos: number;
            stock_almacen_kg: number;
            stock_derivados_kg: number;
            total_muestras: number;
            total_analisis: number;
            total_catas: number;
            total_proveedores: number;
        };
        lotes_por_estado: any[];
        kg_por_mes: any[];
        top_proveedores: any[];
        rendimiento: any[];
        lotes_recientes: any[];
        actividad: any[];
    }>;
}
