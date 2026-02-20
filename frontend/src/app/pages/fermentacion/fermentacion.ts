import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fermentacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fermentacion.html',
  styleUrls: ['./fermentacion.scss']
})
export class Fermentacion implements OnInit {

  // =========================
  // ESTADOS GENERALES
  // =========================

  lotes: any[] = [];
  eventos: any[] = [];

  cargando = true;
  mostrarPanel = false;
  mostrarFormulario = false;

  loteSeleccionado: any = null;

  // =========================
  // MENSAJES
  // =========================

  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  mostrarMensaje = false;

  // =========================
  // FORMULARIO EVENTO
  // =========================

  nuevoEvento: any = {
    tipo: 'INICIO',
    fecha: '',
    hora: '',
    cajon: '',
    brix: null,
    ph_pepa: null,
    ph_pulpa: null,
    temperatura_interna: null,
    temperatura_ambiente: null,
    prueba_corte: false
  };

  selectedFile: File | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // INIT
  // =========================

  ngOnInit() {
    this.cargarLotes();
  }

  // =========================
  // CARGAR LOTES
  // =========================

  cargarLotes() {
    this.http.get<any[]>('http://localhost:3000/fermentacion/lotes')
      .subscribe({
        next: (data) => {
          this.lotes = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
        }
      });
  }

  // =========================
  // PANEL EVENTOS
  // =========================

  abrirPanel(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarPanel = true;

    this.http.get<any[]>(
      `http://localhost:3000/fermentacion/${lote.id}/eventos`
    ).subscribe(data => {
      this.eventos = data;
      this.cdr.detectChanges();
    });
  }

  cerrarPanel() {
    this.mostrarPanel = false;
    this.mostrarFormulario = false;
  }

  // =========================
  // ARCHIVO
  // =========================

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  // =========================
  // GUARDAR EVENTO
  // =========================

  guardarEvento() {

    this.http.post(
      `http://localhost:3000/fermentacion/${this.loteSeleccionado.id}/evento`,
      this.nuevoEvento
    ).subscribe({

      next: () => {

        // Recargar eventos
        this.http.get<any[]>(
          `http://localhost:3000/fermentacion/${this.loteSeleccionado.id}/eventos`
        ).subscribe(data => {
          this.eventos = data;
          this.cdr.detectChanges();
        });

        // Cerrar formulario
        this.mostrarFormulario = false;

        // Reset formulario
        this.nuevoEvento = {
          tipo: 'INICIO',
          fecha: '',
          hora: '',
          cajon: '',
          brix: null,
          ph_pepa: null,
          ph_pulpa: null,
          temperatura_interna: null,
          temperatura_ambiente: null,
          prueba_corte: false
        };

        // Mostrar mensaje éxito
        this.mensaje = 'Evento registrado correctamente';
        this.tipoMensaje = 'success';
        this.mostrarMensajeTemporal();
      },

      error: (err) => {
        this.mensaje = err.error?.message || 'Error al registrar evento';
        this.tipoMensaje = 'error';
        this.mostrarMensajeTemporal();
      }

    });
  }

  // =========================
  // MENSAJE TEMPORAL
  // =========================

  mostrarMensajeTemporal() {
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 3000);
  }
  // contador de meociones
  contarRemocionActual(index: number): number {
    let contador = 0;

    for (let i = 0; i <= index; i++) {
      if (this.eventos[i].tipo === 'REMOCION') {
        contador++;
      }
    }

    return contador;
  }


}
