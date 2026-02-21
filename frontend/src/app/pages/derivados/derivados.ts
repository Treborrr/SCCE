import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-derivados',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './derivados.html',
    styleUrls: ['./derivados.scss']
})
export class Derivados implements OnInit {

    derivados: any[] = [];
    lotesDisponibles: any[] = [];
    cargando = true;

    // Form crear
    mostrarForm = false;
    formDerivado = {
        codigo: '',
        fecha_creacion: '',
        origenes: [] as any[]
    };

    // Muestra
    mostrarMuestraModal = false;
    derivadoParaMuestra: any = null;
    formMuestra = {
        fecha: '',
        peso_muestra_gramos: null as number | null,
        humedad: null as number | null
    };

    // Toast
    mensaje = '';
    tipoMensaje: 'success' | 'error' = 'success';
    mostrarMensaje = false;

    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.cargarDerivados();
    }

    cargarDerivados() {
        this.http.get<any[]>('http://localhost:3000/lotes-derivados')
            .subscribe({
                next: (data) => {
                    this.derivados = data;
                    this.cargando = false;
                    this.cdr.detectChanges();
                },
                error: () => { this.cargando = false; }
            });
    }

    cargarDisponibles() {
        this.http.get<any[]>('http://localhost:3000/lotes-derivados/disponibles')
            .subscribe(data => {
                this.lotesDisponibles = data;
                this.cdr.detectChanges();
            });
    }

    // =========================
    // CREAR DERIVADO
    // =========================

    abrirForm() {
        const ahora = new Date();
        this.formDerivado = {
            codigo: '',
            fecha_creacion: ahora.toISOString().split('T')[0],
            origenes: []
        };
        this.cargarDisponibles();
        this.mostrarForm = true;
    }

    agregarOrigen(lote: any) {
        // Verificar que no esté ya agregado
        const yaEstá = this.formDerivado.origenes.find(
            (o: any) => o.origen_id === lote.id
        );
        if (yaEstá) {
            this.mostrarToast('Este lote ya fue agregado', 'error');
            return;
        }

        this.formDerivado.origenes.push({
            origen_tipo: lote.tipo,
            origen_id: lote.id,
            codigo: lote.codigo,
            proveedor: lote.proveedor_nombre || 'Derivado',
            stock_disponible: Number(lote.stock_actual),
            cantidad_kg: Number(lote.stock_actual) // todo el stock por defecto
        });
    }

    eliminarOrigen(index: number) {
        this.formDerivado.origenes.splice(index, 1);
    }

    get totalFusion(): number {
        return this.formDerivado.origenes.reduce(
            (acc: number, o: any) => acc + Number(o.cantidad_kg || 0), 0
        );
    }

    crearDerivado() {
        if (!this.formDerivado.codigo) {
            this.mostrarToast('El código es obligatorio', 'error');
            return;
        }
        if (this.formDerivado.origenes.length === 0) {
            this.mostrarToast('Debe agregar al menos un lote origen', 'error');
            return;
        }

        // Validar cantidades
        for (const o of this.formDerivado.origenes) {
            if (o.cantidad_kg <= 0 || o.cantidad_kg > o.stock_disponible) {
                this.mostrarToast(`Cantidad inválida para ${o.codigo}`, 'error');
                return;
            }
        }

        const payload = {
            codigo: this.formDerivado.codigo,
            fecha_creacion: this.formDerivado.fecha_creacion,
            origenes: this.formDerivado.origenes.map((o: any) => ({
                origen_tipo: o.origen_tipo,
                origen_id: o.origen_id,
                cantidad_kg: o.cantidad_kg
            }))
        };

        this.http.post('http://localhost:3000/lotes-derivados/crear', payload)
            .subscribe({
                next: () => {
                    this.mostrarForm = false;
                    this.cargarDerivados();
                    this.mostrarToast('Lote derivado creado correctamente', 'success');
                },
                error: (err) => {
                    this.mostrarToast(err.error?.message || 'Error al crear', 'error');
                }
            });
    }

    // =========================
    // MUESTRA
    // =========================

    abrirMuestra(derivado: any) {
        this.derivadoParaMuestra = derivado;
        const ahora = new Date();
        this.formMuestra = {
            fecha: ahora.toISOString().split('T')[0],
            peso_muestra_gramos: null,
            humedad: null
        };
        this.mostrarMuestraModal = true;
    }

    crearMuestra() {
        if (!this.formMuestra.peso_muestra_gramos || this.formMuestra.peso_muestra_gramos <= 0) {
            this.mostrarToast('El peso de la muestra es obligatorio', 'error');
            return;
        }

        this.http.post(
            `http://localhost:3000/lotes-derivados/${this.derivadoParaMuestra.id}/muestra`,
            this.formMuestra
        ).subscribe({
            next: () => {
                this.mostrarMuestraModal = false;
                this.cargarDerivados();
                this.mostrarToast('Muestra creada correctamente', 'success');
            },
            error: (err) => {
                this.mostrarToast(err.error?.message || 'Error al crear muestra', 'error');
            }
        });
    }

    // =========================
    // TOAST
    // =========================

    mostrarToast(msg: string, tipo: 'success' | 'error') {
        this.mensaje = msg;
        this.tipoMensaje = tipo;
        this.mostrarMensaje = true;
        setTimeout(() => {
            this.mostrarMensaje = false;
            this.cdr.detectChanges();
        }, 4000);
    }
}
