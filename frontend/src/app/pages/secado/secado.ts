import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-secado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './secado.html',
  styleUrls: ['./secado.scss']
})
export class Secado implements OnInit {

  lotes: any[] = [];
  eventos: any[] = [];
  loteSeleccionado: any = null;

  cargando = true;
  mostrarPanel = false;
  mostrarFormulario = false;

  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  mostrarMensaje = false;

  nuevoEvento: any = {
    tipo: 'FIN',
    fecha: '',
    hora: '',
    temperatura_ambiente: null
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarLotes();
  }

  cargarLotes() {
    this.http.get<any[]>('http://localhost:3000/secado/lotes')
      .subscribe({
        next: (data) => {
          console.log('SECADO LOTES:', data);
          this.lotes = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
  }

  abrirPanel(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarPanel = true;

    this.http.get<any[]>(
      `http://localhost:3000/secado/${lote.id}/eventos`
    ).subscribe(data => {
      this.eventos = data;
      this.cdr.detectChanges();
    });
  }

  cerrarPanel() {
    this.mostrarPanel = false;
    this.mostrarFormulario = false;
  }

  guardarEvento() {
    this.http.post(
      `http://localhost:3000/secado/${this.loteSeleccionado.id}/finalizar`,
      this.nuevoEvento
    ).subscribe({
      next: () => {

        this.mostrarFormulario = false;

        this.nuevoEvento = {
          tipo: 'FIN',
          fecha: '',
          hora: '',
          temperatura_ambiente: null
        };

        this.mensaje = 'Secado finalizado correctamente';
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();

        this.cargarLotes();
        this.cerrarPanel();
      },

      error: (err) => {
        this.mensaje = err.error?.message || 'Error al finalizar secado';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }
    });
  }

  mostrarConfirmacion = false;
  mostrarMensajeTemporal() {
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 3000);
  }
  abrirConfirmacion(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarConfirmacion = true;
  }

  cerrarConfirmacion() {
    this.mostrarConfirmacion = false;
  }

  confirmarFinalizacion() {

    this.http.post(
      `http://localhost:3000/secado/${this.loteSeleccionado.id}/finalizar`,
      {
        fecha_fin: new Date().toISOString().split('T')[0],
        hora_fin: new Date().toTimeString().slice(0,5)
      }
    ).subscribe({
      next: () => {

        this.mostrarConfirmacion = false;
        this.cargarLotes();

        this.mensaje = 'Secado finalizado correctamente';
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();
      },
      error: (err) => {

        this.mensaje = err.error?.message || 'Error al finalizar secado';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }
    });

  }

  // para modal
  mostrarModal = false;

  formFinal: any = {
    fecha_fin: '',
    hora_fin: '',
    temperatura_ambiente: null
  };

  abrirModalFinalizar(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarModal = true;

    // Prellenar fecha y hora actual
    const ahora = new Date();

    this.formFinal.fecha_fin = ahora.toISOString().split('T')[0];
    this.formFinal.hora_fin = ahora.toTimeString().slice(0,5);
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  finalizarSecado() {

    if (!this.formFinal.fecha_fin || !this.formFinal.hora_fin) {
      this.mensaje = 'Fecha y hora son obligatorias';
      this.tipoMensaje = 'error';
      this.mostrarMensajeTemporal();
      return;
    }

    this.http.post(
      `http://localhost:3000/secado/${this.loteSeleccionado.id}/finalizar`,
      {
        tipo: 'FIN',
        fecha_fin: this.formFinal.fecha_fin,
        hora_fin: this.formFinal.hora_fin,
        temperatura_ambiente: this.formFinal.temperatura_ambiente
      }
    ).subscribe({
      next: () => {

        this.mostrarModal = false;
        this.cargarLotes();

        this.mensaje = 'Secado finalizado correctamente';
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error al finalizar secado';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }
    });

}




}
