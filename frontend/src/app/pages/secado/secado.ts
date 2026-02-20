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
          this.lotes = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => this.cargando = false
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
      `http://localhost:3000/secado/${this.loteSeleccionado.id}/evento`,
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

  mostrarMensajeTemporal() {
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 3000);
  }

}
