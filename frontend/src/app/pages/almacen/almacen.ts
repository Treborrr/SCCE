import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [
    CommonModule,   // 👈 NECESARIO para *ngIf y date pipe
    FormsModule     // 👈 NECESARIO para ngModel
  ],
  templateUrl: './almacen.html',
  styleUrls: ['./almacen.scss']
})
export class Almacen implements OnInit {

  lotes: any[] = [];
  mostrarModal = false;
  loteSeleccionado: any = null;

  form = {
  fecha: '',
  hora: '',
  sacos: 0,
  kg_brutos: 0,
  kg_neto: 0,
  rendimiento: 0
  };


  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarLotes();
  }

  cargarLotes() {
    this.http.get<any[]>('http://localhost:3000/almacen/lotes')
      .subscribe(data => this.lotes = data);
  }

  abrirModal(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarModal = true;

    const ahora = new Date();
    this.form.fecha = ahora.toISOString().split('T')[0];
    this.form.hora = ahora.toTimeString().slice(0,5);
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
  
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  mostrarMensaje = false;

  mostrarMensajeTemporal() { 
    setTimeout(() => {
      this.mensaje = '';
    }, 3000);
  }

  registrarIngreso() {
    this.http.post(
      `http://localhost:3000/almacen/${this.loteSeleccionado.id}/ingresar`,
      this.form
    ).subscribe({
      next: () => {
        this.mostrarModal = false;
        this.cargarLotes();

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

  animatedKgNeto = 0;
  animatedRendimiento = 0;
  perdidaKg = 0;
  kgNetoPreview: number = 0;          
  rendimientoPreview: number = 0; 
  calcularPreview() {
    const sacos = Number(this.form.sacos);
    const kgBrutos = Number(this.form.kg_brutos);

    if (!this.loteSeleccionado) return;

    if (sacos > 0 && kgBrutos > 0) {

      const kgNeto = kgBrutos - (sacos * 0.2);
      const rendimiento =
        (kgNeto / this.loteSeleccionado.kg_baba_compra) * 100;

      this.perdidaKg = Number((kgBrutos - kgNeto).toFixed(2));

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

}
