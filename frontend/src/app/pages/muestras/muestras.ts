import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import QRCode from 'qrcode';

@Component({
  selector: 'app-muestras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './muestras.html',
  styleUrls: ['./muestras.scss']
})
export class Muestras implements OnInit {

  muestras: any[] = [];
  cargando = true;
  activeTab: 'analisis' | 'catas' = 'analisis';

  // Panel de análisis
  mostrarPanel = false;
  muestraSeleccionada: any = null;
  analisisList: any[] = [];

  // Modal crear análisis
  mostrarFormAnalisis = false;

  formAnalisis: any = {
    fecha: '',
    peso_muestra_gramos: null,
    humedad_porcentaje: null,
    foto_url: null,
    // Defectos
    planos_gr: null,
    materia_extrana_gr: null,
    granos_menores_1gr_gr: null,
    pasillas_gr: null,
    multiples_gr: null,
    germinados_gr: null,
    // Calibre
    numero_granos_evaluados: null,
    peso_100_granos_gr: null,
    // Prueba de corte
    numero_grupos_50_granos: 0,
    grupos: [] as any[]
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Toast
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';
  mostrarMensaje = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarMuestras();
  }

  cargarMuestras() {
    this.http.get<any[]>('/muestras/todas')
      .subscribe({
        next: (data) => {
          this.muestras = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
        }
      });
  }

  // =========================
  // PANEL ANÁLISIS
  // =========================

  abrirPanel(muestra: any) {
    this.muestraSeleccionada = muestra;
    this.mostrarPanel = true;
    this.cargarAnalisis(muestra.id);
    this.cargarCatas(muestra.id);
  }

  cerrarPanel() {
    this.mostrarPanel = false;
    this.mostrarFormAnalisis = false;
  }

  cargarAnalisis(muestraId: string) {
    this.http.get<any[]>(
      `/muestras/${muestraId}/analisis`
    ).subscribe(data => {
      this.analisisList = data;
      this.cdr.detectChanges();
    });
  }

  // =========================
  // GRUPOS DINÁMICOS
  // =========================

  onGruposChange() {
    const n = Number(this.formAnalisis.numero_grupos_50_granos) || 0;
    const actual = this.formAnalisis.grupos.length;

    if (n > actual) {
      for (let i = actual; i < n; i++) {
        this.formAnalisis.grupos.push({
          fermentado: 0,
          violeta: 0,
          pizarroso: 0,
          hongos: 0,
          insectos: 0
        });
      }
    } else if (n < actual) {
      this.formAnalisis.grupos = this.formAnalisis.grupos.slice(0, n);
    }
  }

  // =========================
  // FOTO
  // =========================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
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
    this.formAnalisis.foto_url = null;
    const input = document.querySelector('.file-input-analisis') as HTMLInputElement;
    if (input) input.value = '';
    this.cdr.detectChanges();
  }

  subirFoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) { resolve(''); return; }
      const formData = new FormData();
      formData.append('foto', this.selectedFile);
      this.http.post<{ foto_url: string }>(
        '/muestras/upload-foto',
        formData
      ).subscribe({
        next: (res) => resolve(res.foto_url),
        error: (err) => reject(err)
      });
    });
  }

  // =========================
  // GUARDAR ANÁLISIS
  // =========================

  async guardarAnalisis() {
    if (!this.formAnalisis.fecha) {
      this.mostrarToast('La fecha es obligatoria', 'error');
      return;
    }

    try {
      if (this.selectedFile) {
        this.formAnalisis.foto_url = await this.subirFoto();
      }

      this.http.post(
        `/muestras/${this.muestraSeleccionada.id}/analisis`,
        this.formAnalisis
      ).subscribe({
        next: () => {
          this.mostrarFormAnalisis = false;
          this.cargarAnalisis(this.muestraSeleccionada.id);
          this.cargarMuestras();
          this.resetFormAnalisis();
          this.mostrarToast('Análisis físico registrado correctamente', 'success');
        },
        error: (err) => {
          this.mostrarToast(err.error?.message || 'Error al registrar', 'error');
        }
      });
    } catch {
      this.mostrarToast('Error al subir la foto', 'error');
    }
  }

  resetFormAnalisis() {
    this.formAnalisis = {
      fecha: '',
      peso_muestra_gramos: null,
      humedad_porcentaje: null,
      foto_url: null,
      planos_gr: null,
      materia_extrana_gr: null,
      granos_menores_1gr_gr: null,
      pasillas_gr: null,
      multiples_gr: null,
      germinados_gr: null,
      numero_granos_evaluados: null,
      peso_100_granos_gr: null,
      numero_grupos_50_granos: 0,
      grupos: []
    };
    this.selectedFile = null;
    this.previewUrl = null;
  }

  abrirFormAnalisis() {
    this.resetFormAnalisis();
    const ahora = new Date();
    this.formAnalisis.fecha = ahora.toISOString().split('T')[0];
    this.mostrarFormAnalisis = true;
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

  // Calcular total defectos
  totalDefectos(a: any): number {
    return Number(a.planos_gr || 0) +
      Number(a.materia_extrana_gr || 0) +
      Number(a.granos_menores_1gr_gr || 0) +
      Number(a.pasillas_gr || 0) +
      Number(a.multiples_gr || 0) +
      Number(a.germinados_gr || 0);
  }

  // =========================
  // CATAS
  // =========================

  catasList: any[] = [];
  mostrarFormCata = false;
  mostrarLinksModal = false;
  cataLinks: any[] = [];

  formCata = {
    tipo: 'NORMAL',
    fecha: '',
    temperatura: null as number | null,
    tiempo: null as number | null,
    tostadora: '',
    total_catadores: 3
  };

  cargarCatas(muestraId: string) {
    this.http.get<any[]>(
      `/cata/muestra/${muestraId}`
    ).subscribe(data => {
      this.catasList = data;
      this.cdr.detectChanges();
    });
  }

  abrirFormCata() {
    const ahora = new Date();
    this.formCata = {
      tipo: 'NORMAL',
      fecha: ahora.toISOString().split('T')[0],
      temperatura: null,
      tiempo: null,
      tostadora: '',
      total_catadores: 3
    };
    this.mostrarFormCata = true;
  }

  async crearCata() {
    if (!this.formCata.total_catadores || this.formCata.total_catadores < 1) {
      this.mostrarToast('Debe haber al menos 1 catador', 'error');
      return;
    }

    this.http.post<any>(
      `/cata/${this.muestraSeleccionada.id}/crear`,
      this.formCata
    ).subscribe({
      next: async (res) => {
        this.mostrarFormCata = false;
        // Generar QR codes para cada link
        for (const link of res.links) {
          try {
            link.qrDataUrl = await QRCode.toDataURL(link.url, {
              width: 120,
              margin: 1,
              color: { dark: '#1e293b', light: '#ffffff' }
            });
          } catch {
            link.qrDataUrl = null;
          }
        }
        this.cataLinks = res.links;
        this.mostrarLinksModal = true;
        this.cargarCatas(this.muestraSeleccionada.id);
        this.mostrarToast('Cata creada. ¡Comparte los links o QR!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.mostrarToast(err.error?.message || 'Error al crear cata', 'error');
      }
    });
  }

  copiarLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this.mostrarToast('Link copiado al portapapeles', 'success');
    });
  }

  // Resultados de una cata
  cataResultados: any[] = [];
  mostrarResultados = false;
  cataSeleccionada: any = null;

  verResultados(cata: any) {
    this.cataSeleccionada = cata;
    this.http.get<any[]>(
      `/cata/${cata.id}/resultados`
    ).subscribe(data => {
      this.cataResultados = data;
      this.mostrarResultados = true;
      this.cdr.detectChanges();
    });
  }
}
