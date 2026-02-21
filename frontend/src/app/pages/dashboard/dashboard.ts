import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit, AfterViewInit {

  stats: any = null;
  cargando = true;

  @ViewChild('chartEstado') chartEstado!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMensual') chartMensual!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartProveedores') chartProveedores!: ElementRef<HTMLCanvasElement>;

  private chartsReady = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.http.get<any>('/dashboard/stats').subscribe({
      next: (data) => {
        this.stats = data;
        this.cargando = false;
        this.cdr.detectChanges();
        if (this.chartsReady) this.dibujarGraficos();
      },
      error: () => { this.cargando = false; }
    });
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    if (this.stats) this.dibujarGraficos();
  }

  dibujarGraficos() {
    setTimeout(() => {
      this.dibujarDonaEstados();
      this.dibujarBarrasMensual();
      this.dibujarBarrasProveedores();
    }, 100);
  }

  // ========================
  // GRÁFICO DONA: Estados
  // ========================
  dibujarDonaEstados() {
    const canvas = this.chartEstado?.nativeElement;
    if (!canvas || !this.stats?.lotes_por_estado) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats.lotes_por_estado;
    const total = data.reduce((s: number, d: any) => s + Number(d.cantidad), 0);
    if (total === 0) return;

    const colors: Record<string, string> = {
      'INGRESADO': '#94a3b8',
      'LISTO_PARA_FERMENTACION': '#fbbf24',
      'FERMENTACION': '#f97316',
      'SECADO': '#ef4444',
      'LISTO_PARA_ALMACEN': '#8b5cf6',
      'ALMACEN': '#22c55e'
    };

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const outerR = Math.min(cx, cy) - 10;
    const innerR = outerR * 0.6;

    let angle = -Math.PI / 2;

    for (const item of data) {
      const slice = (Number(item.cantidad) / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = colors[item.estado] || '#cbd5e1';
      ctx.fill();
      angle += slice;
    }

    // Centro
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Lotes', cx, cy + 14);
  }

  // ========================
  // GRÁFICO BARRAS: Mensual
  // ========================
  dibujarBarrasMensual() {
    const canvas = this.chartMensual?.nativeElement;
    if (!canvas || !this.stats?.kg_por_mes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats.kg_por_mes;
    if (data.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    const maxKg = Math.max(...data.map((d: any) => Number(d.kg_baba)));
    const barW = chartW / data.length * 0.6;
    const gap = chartW / data.length * 0.4;

    // Líneas guía
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(maxKg * i / 4) + ' kg', padding.left - 6, y);
    }

    // Barras
    data.forEach((item: any, i: number) => {
      const x = padding.left + i * (barW + gap) + gap / 2;
      const h = maxKg > 0 ? (Number(item.kg_baba) / maxKg) * chartH : 0;
      const y = padding.top + chartH - h;

      // Gradiente
      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = grad;

      // Barra con bordes redondeados
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, padding.top + chartH);
      ctx.lineTo(x, padding.top + chartH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();

      // Label mes
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.mes_label, x + barW / 2, H - padding.bottom + 16);

      // Valor
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(Number(item.kg_baba).toFixed(0), x + barW / 2, y - 6);
    });
  }

  // ========================
  // GRÁFICO BARRAS: Proveedores
  // ========================
  dibujarBarrasProveedores() {
    const canvas = this.chartProveedores?.nativeElement;
    if (!canvas || !this.stats?.top_proveedores) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = this.stats.top_proveedores;
    if (data.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;
    const padding = { top: 10, right: 20, bottom: 10, left: 100 };
    const chartW = W - padding.left - padding.right;
    const barH = 24;
    const gap = 12;

    const maxKg = Math.max(...data.map((d: any) => Number(d.total_kg)));

    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#d97706', '#059669'];

    data.forEach((item: any, i: number) => {
      const y = padding.top + i * (barH + gap);
      const w = maxKg > 0 ? (Number(item.total_kg) / maxKg) * chartW : 0;

      // Nombre
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const name = item.proveedor_nombre?.length > 12
        ? item.proveedor_nombre.substring(0, 12) + '…'
        : item.proveedor_nombre;
      ctx.fillText(name, padding.left - 8, y + barH / 2);

      // Barra
      ctx.fillStyle = colors[i] || '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(padding.left, y, w, barH, 4);
      ctx.fill();

      // Valor
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      if (w > 50) {
        ctx.fillText(Number(item.total_kg).toFixed(0) + ' kg', padding.left + 8, y + barH / 2);
      }
    });
  }

  // Helpers
  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      'INGRESADO': 'Ingresado',
      'LISTO_PARA_FERMENTACION': 'Listo Ferm.',
      'FERMENTACION': 'Fermentación',
      'SECADO': 'Secado',
      'LISTO_PARA_ALMACEN': 'Listo Almacén',
      'ALMACEN': 'Almacén',
      'CONSUMIDO': 'Consumido'
    };
    return map[estado] || estado;
  }

  getEstadoColor(estado: string): string {
    const map: Record<string, string> = {
      'INGRESADO': '#94a3b8',
      'LISTO_PARA_FERMENTACION': '#fbbf24',
      'FERMENTACION': '#f97316',
      'SECADO': '#ef4444',
      'LISTO_PARA_ALMACEN': '#8b5cf6',
      'ALMACEN': '#22c55e',
      'CONSUMIDO': '#475569'
    };
    return map[estado] || '#cbd5e1';
  }

  getLotesPorEstado(estado: string): number {
    const item = this.stats?.lotes_por_estado?.find((e: any) => e.estado === estado);
    return item ? Number(item.cantidad) : 0;
  }
}
