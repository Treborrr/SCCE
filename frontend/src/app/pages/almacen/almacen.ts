import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen.html',
  styleUrls: ['./almacen.scss']
})
export class Almacen implements OnInit {

  // Lotes pendientes de ingresar a almacén
  lotesListos: any[] = [];
  // Lotes ya en almacén
  lotesEnAlmacen: any[] = [];

  // Modal Ingreso
  mostrarModalIngreso = false;
  loteSeleccionado: any = null;

  formIngreso = {
    fecha: '',
    hora: '',
    sacos: 0,
    kg_brutos: 0
  };

  // Modal Muestra
  mostrarModalMuestra = false;
  loteParaMuestra: any = null;

  formMuestra = {
    fecha: '',
    peso_muestra_gramos: null as number | null,
    humedad: null as number | null
  };

  // Mensajes
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';
  mostrarMensaje = false;

  // Preview cálculos ingreso
  animatedKgNeto = 0;
  animatedRendimiento = 0;
  perdidaKg = 0; // merma: kg baba - kg neto

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.http.get<any[]>('/almacen/lotes')
      .subscribe(data => {
        this.lotesListos = data.filter(l => l.estado === 'LISTO_PARA_ALMACEN');
        this.cdr.detectChanges();
      });

    this.http.get<any[]>('/almacen/en-almacen')
      .subscribe(data => {
        this.lotesEnAlmacen = data;
        this.cdr.detectChanges();
      });
  }

  // =========================
  // MODAL INGRESO ALMACÉN
  // =========================

  abrirModalIngreso(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarModalIngreso = true;

    const ahora = new Date();
    this.formIngreso.fecha = ahora.toISOString().split('T')[0];
    this.formIngreso.hora = ahora.toTimeString().slice(0, 5);
    this.formIngreso.sacos = 0;
    this.formIngreso.kg_brutos = 0;
    this.animatedKgNeto = 0;
    this.animatedRendimiento = 0;
    this.perdidaKg = 0;
  }

  cerrarModalIngreso() {
    this.mostrarModalIngreso = false;
  }

  calcularPreview() {
    const sacos = Number(this.formIngreso.sacos);
    const kgBrutos = Number(this.formIngreso.kg_brutos);

    if (!this.loteSeleccionado) return;

    if (sacos > 0 && kgBrutos > 0) {
      const kgNeto = kgBrutos - (sacos * 0.2);
      const rendimiento = (kgNeto / this.loteSeleccionado.kg_baba_compra) * 100;
      this.perdidaKg = Number((this.loteSeleccionado.kg_baba_compra - kgNeto).toFixed(2));
      this.animarNumero('kg', kgNeto);
      this.animarNumero('rendimiento', rendimiento);
    } else {
      this.animatedKgNeto = 0;
      this.animatedRendimiento = 0;
      this.perdidaKg = 0;
    }
  }

  animarNumero(tipo: 'kg' | 'rendimiento', valorFinal: number) {
    const duracion = 400;
    const pasos = 20;
    const incremento = valorFinal / pasos;
    let actual = 0;
    let contador = 0;

    const intervalo = setInterval(() => {
      contador++;
      actual += incremento;

      if (tipo === 'kg') {
        this.animatedKgNeto = Number(actual.toFixed(2));
      } else {
        this.animatedRendimiento = Number(actual.toFixed(2));
      }

      if (contador >= pasos) {
        clearInterval(intervalo);
        if (tipo === 'kg') {
          this.animatedKgNeto = Number(valorFinal.toFixed(2));
        } else {
          this.animatedRendimiento = Number(valorFinal.toFixed(2));
        }
      }
    }, duracion / pasos);
  }

  registrarIngreso() {
    this.http.post(
      `/almacen/${this.loteSeleccionado.id}/ingresar`,
      this.formIngreso
    ).subscribe({
      next: () => {
        this.mostrarModalIngreso = false;
        this.cargarTodo();
        this.mensaje = 'Ingreso registrado correctamente';
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'No se pudo registrar';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }
    });
  }

  // =========================
  // MODAL CREAR MUESTRA
  // =========================

  abrirModalMuestra(lote: any) {
    this.loteParaMuestra = lote;
    this.mostrarModalMuestra = true;

    const ahora = new Date();
    this.formMuestra = {
      fecha: ahora.toISOString().split('T')[0],
      peso_muestra_gramos: null,
      humedad: null
    };
  }

  cerrarModalMuestra() {
    this.mostrarModalMuestra = false;
  }

  registrarMuestra() {
    if (!this.formMuestra.fecha || !this.formMuestra.peso_muestra_gramos) {
      this.mensaje = 'Debe ingresar fecha y peso de la muestra';
      this.tipoMensaje = 'error';
      this.mostrarMensajeTemporal();
      return;
    }

    this.http.post(
      `/muestras/${this.loteParaMuestra.id}/crear`,
      this.formMuestra
    ).subscribe({
      next: (res: any) => {
        this.mostrarModalMuestra = false;
        this.cargarTodo();
        this.mensaje = `Muestra creada. Stock actualizado: ${res.nuevo_stock?.toFixed(2)} kg`;
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al crear muestra';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }
    });
  }

  // =========================
  // TOAST
  // =========================

  mostrarMensajeTemporal() {
    this.mostrarMensaje = true;
    setTimeout(() => {
      this.mostrarMensaje = false;
      this.cdr.detectChanges();
    }, 4000);
  }

}
