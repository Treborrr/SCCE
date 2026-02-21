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
    prueba_corte: false,
    foto_url: null
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  subiendoFoto = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

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
  // VALIDACIONES FRONTEND
  // =========================

  tieneEventoInicio(): boolean {
    return this.eventos.some(e => e.tipo === 'INICIO');
  }

  tieneEventoFinal(): boolean {
    return this.eventos.some(e => e.tipo === 'FINAL');
  }

  obtenerUltimaFecha(): string | null {
    if (this.eventos.length === 0) return null;
    const ultimo = this.eventos[this.eventos.length - 1];
    return ultimo.fecha ? String(ultimo.fecha).split('T')[0] : null;
  }

  validarEvento(): string | null {
    const tipo = this.nuevoEvento.tipo;

    // Validar que REMOCION, CONTROL, FINAL tengan INICIO previo
    if ((tipo === 'REMOCION' || tipo === 'CONTROL' || tipo === 'FINAL') && !this.tieneEventoInicio()) {
      return `No se puede registrar ${tipo} sin un evento INICIO previo.`;
    }

    // Validar que no haya otro INICIO
    if (tipo === 'INICIO' && this.tieneEventoInicio()) {
      return 'El lote ya tiene un evento INICIO registrado.';
    }

    // Validar que no se agreguen eventos después del FINAL
    if (this.tieneEventoFinal()) {
      return 'No se puede registrar eventos después del FINAL.';
    }

    // Validar campos obligatorios
    if (!this.nuevoEvento.fecha || !this.nuevoEvento.hora) {
      return 'La fecha y hora son obligatorias.';
    }

    // Validar fecha no menor al último evento
    const ultimaFecha = this.obtenerUltimaFecha();
    if (ultimaFecha && this.nuevoEvento.fecha < ultimaFecha) {
      return `La fecha no puede ser anterior al último evento (${ultimaFecha}).`;
    }

    // Validar foto obligatoria si prueba de corte
    if (this.nuevoEvento.prueba_corte && !this.selectedFile && !this.nuevoEvento.foto_url) {
      return 'Debe subir una foto cuando hay Prueba de Corte.';
    }

    return null;
  }

  // =========================
  // ARCHIVO FOTO
  // =========================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Crear preview local
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarFoto() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.nuevoEvento.foto_url = null;
    // Limpiar el input file del DOM
    const fileInput = document.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.cdr.detectChanges();
  }

  // =========================
  // SUBIR FOTO AL BACKEND
  // =========================

  subirFoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve('');
        return;
      }

      const formData = new FormData();
      formData.append('foto', this.selectedFile);

      this.subiendoFoto = true;

      this.http.post<{ foto_url: string }>(
        'http://localhost:3000/fermentacion/upload',
        formData
      ).subscribe({
        next: (res) => {
          this.subiendoFoto = false;
          resolve(res.foto_url);
        },
        error: (err) => {
          this.subiendoFoto = false;
          reject(err);
        }
      });
    });
  }

  // =========================
  // GUARDAR EVENTO
  // =========================

  async guardarEvento() {
    // Validar antes de enviar
    const error = this.validarEvento();
    if (error) {
      this.mensaje = error;
      this.tipoMensaje = 'error';
      this.mostrarMensajeTemporal();
      return;
    }

    try {
      // Si hay foto, subirla primero
      if (this.selectedFile) {
        const fotoUrl = await this.subirFoto();
        this.nuevoEvento.foto_url = fotoUrl;
      }

      // Enviar evento
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

          // Recargar lotes para actualizar estado
          this.cargarLotes();

          // Cerrar formulario
          this.mostrarFormulario = false;

          // Reset formulario
          this.resetFormulario();

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
    } catch (err) {
      this.mensaje = 'Error al subir la foto';
      this.tipoMensaje = 'error';
      this.mostrarMensajeTemporal();
    }
  }

  resetFormulario() {
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
      prueba_corte: false,
      foto_url: null
    };
    this.selectedFile = null;
    this.previewUrl = null;
  }

  // =========================
  // MENSAJE TEMPORAL
  // =========================

  mostrarMensajeTemporal() {
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // contador de remociones
  contarRemocionActual(index: number): number {
    let contador = 0;

    for (let i = 0; i <= index; i++) {
      if (this.eventos[i].tipo === 'REMOCION') {
        contador++;
      }
    }

    return contador;
  }

  // =========================
  // SUBIR FOTO A EVENTO EXISTENTE
  // =========================

  editandoFotoId: string | null = null;
  fotoEventoFile: File | null = null;
  descripcionEvento = '';

  iniciarSubirFoto(evento: any) {
    this.editandoFotoId = evento.id;
    this.fotoEventoFile = null;
    this.descripcionEvento = evento.descripcion || '';
  }

  cancelarSubirFoto() {
    this.editandoFotoId = null;
    this.fotoEventoFile = null;
    this.descripcionEvento = '';
  }

  onFotoEventoSelected(event: any) {
    this.fotoEventoFile = event.target.files[0] || null;
  }

  async guardarFotoEvento(evento: any) {
    if (!this.fotoEventoFile) {
      this.mensaje = 'Selecciona una imagen';
      this.tipoMensaje = 'error';
      this.mostrarMensaje = true;
      this.mostrarMensajeTemporal();
      return;
    }

    this.subiendoFoto = true;

    try {
      // 1. Subir foto
      const formData = new FormData();
      formData.append('foto', this.fotoEventoFile);

      const uploadRes: any = await new Promise((resolve, reject) => {
        this.http.post('http://localhost:3000/fermentacion/upload', formData)
          .subscribe({ next: resolve, error: reject });
      });

      // 2. Actualizar evento con la foto
      await new Promise((resolve, reject) => {
        this.http.patch(`http://localhost:3000/fermentacion/evento/${evento.id}/foto`, {
          foto_url: uploadRes.foto_url,
          descripcion: this.descripcionEvento || null
        }).subscribe({ next: resolve, error: reject });
      });

      // 3. Actualizar UI
      evento.foto_url = uploadRes.foto_url;
      evento.prueba_corte = true;
      if (this.descripcionEvento) evento.descripcion = this.descripcionEvento;
      this.cancelarSubirFoto();

      this.mensaje = 'Foto agregada correctamente';
      this.tipoMensaje = 'success';
      this.mostrarMensaje = true;
      this.mostrarMensajeTemporal();
      this.cdr.detectChanges();

    } catch (err) {
      this.mensaje = 'Error al subir la foto';
      this.tipoMensaje = 'error';
      this.mostrarMensaje = true;
      this.mostrarMensajeTemporal();
    } finally {
      this.subiendoFoto = false;
    }
  }

}
