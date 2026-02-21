import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-cata-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cata-form.html',
    styleUrls: ['./cata-form.scss']
})
export class CataForm implements OnInit {

    token = '';
    invitacion: any = null;
    cargando = true;
    error = '';
    enviado = false;

    form: any = {
        nombre_catador: '',
        fecha: '',
        tipo_tueste: '',
        tostado: 0,
        defecto: 0,
        cacao: 0,
        amargor: 0,
        astringencia: 0,
        acidez: 0,
        fruta_fresca: 0,
        fruta_marron: 0,
        vegetal: 0,
        floral: 0,
        madera: 0,
        especies: 0,
        nueces: 0,
        caramel_pan: 0,
        global: 0
    };

    atributos = [
        { key: 'tostado', label: 'Tostado' },
        { key: 'defecto', label: 'Defecto' },
        { key: 'cacao', label: 'Cacao' },
        { key: 'amargor', label: 'Amargor' },
        { key: 'astringencia', label: 'Astringencia' },
        { key: 'acidez', label: 'Acidez' },
        { key: 'fruta_fresca', label: 'Fruta Fresca' },
        { key: 'fruta_marron', label: 'Fruta Marrón' },
        { key: 'vegetal', label: 'Vegetal' },
        { key: 'floral', label: 'Floral' },
        { key: 'madera', label: 'Madera' },
        { key: 'especies', label: 'Especies' },
        { key: 'nueces', label: 'Nueces' },
        { key: 'caramel_pan', label: 'Caramelo / Pan' },
        { key: 'global', label: 'Global' }
    ];

    leyenda = [
        { valor: '0', desc: 'Ausente' },
        { valor: '1', desc: 'Solo un rastro' },
        { valor: '2', desc: 'Presente con baja intensidad' },
        { valor: '3–5', desc: 'Presente' },
        { valor: '6', desc: 'Caracteriza claramente la muestra' },
        { valor: '7–8', desc: 'Dominante' },
        { valor: '9–10', desc: 'Máximo, intensidad muy fuerte' }
    ];

    @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
    private needsRedraw = true;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.cargarInvitacion();
    }

    ngAfterViewChecked() {
        if (this.needsRedraw && this.radarCanvas) {
            this.dibujarRadar();
            this.needsRedraw = false;
        }
    }

    cargarInvitacion() {
        this.http.get<any>(
            `/cata/invitacion/${this.token}`
        ).subscribe({
            next: (data) => {
                this.invitacion = data;
                this.cargando = false;

                if (data.estado === 'RESPONDIDA') {
                    this.error = 'Esta invitación ya fue respondida.';
                }

                // Pre-llenar datos
                this.form.tipo_tueste = data.tipo_tueste || '';
                const ahora = new Date();
                this.form.fecha = data.cata_fecha?.split('T')[0] || ahora.toISOString().split('T')[0];

                this.cdr.detectChanges();
                this.needsRedraw = true;
            },
            error: () => {
                this.cargando = false;
                this.error = 'Token inválido o expirado.';
            }
        });
    }

    onSliderChange() {
        this.needsRedraw = true;
        this.cdr.detectChanges();
    }

    getIntensidadLabel(value: number): string {
        if (value === 0) return 'Ausente';
        if (value === 1) return 'Rastro';
        if (value === 2) return 'Baja';
        if (value <= 5) return 'Presente';
        if (value === 6) return 'Caracteriza';
        if (value <= 8) return 'Dominante';
        return 'Máximo';
    }

    getIntensidadColor(value: number): string {
        if (value === 0) return '#e5e7eb';
        if (value <= 2) return '#93c5fd';
        if (value <= 5) return '#60a5fa';
        if (value <= 7) return '#f59e0b';
        return '#ef4444';
    }

    // ==================
    // RADAR CHART
    // ==================

    dibujarRadar() {
        const canvas = this.radarCanvas?.nativeElement;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const maxR = Math.min(cx, cy) - 40;

        ctx.clearRect(0, 0, W, H);

        const n = this.atributos.length;
        const angleStep = (2 * Math.PI) / n;

        // Dibujar anillos
        for (let level = 2; level <= 10; level += 2) {
            const r = (level / 10) * maxR;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Número del nivel
            ctx.fillStyle = '#ccc';
            ctx.font = '10px sans-serif';
            ctx.fillText(String(level), cx + 3, cy - r + 10);
        }

        // Dibujar ejes y labels
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + maxR * Math.cos(angle);
            const y = cy + maxR * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Label
            const lx = cx + (maxR + 22) * Math.cos(angle);
            const ly = cy + (maxR + 22) * Math.sin(angle);
            ctx.fillStyle = '#374151';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.atributos[i].label, lx, ly);
        }

        // Dibujar polígono de datos
        const values = this.atributos.map(a => Number(this.form[a.key]) || 0);

        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const r = (values[i] / 10) * maxR;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.fill();

        // Stroke
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Puntos
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const r = (values[i] / 10) * maxR;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#2563eb';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // ==================
    // ENVIAR
    // ==================

    enviar() {
        if (!this.form.nombre_catador) {
            this.error = 'El nombre del catador es obligatorio';
            setTimeout(() => this.error = '', 3000);
            return;
        }

        this.http.post(
            `/cata/responder/${this.token}`,
            this.form
        ).subscribe({
            next: () => {
                this.enviado = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = err.error?.message || 'Error al enviar';
                setTimeout(() => this.error = '', 4000);
            }
        });
    }
}
