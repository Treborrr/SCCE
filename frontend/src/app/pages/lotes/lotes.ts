import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lotes.html',
  styleUrl: './lotes.scss'
})
export class Lotes implements OnInit {

  lotes: any[] = [];
  mostrarModal = false;
  mensajeExito = '';

  nuevoLote = {
    codigo: '',
    fecha_compra: '',
    proveedor_nombre: '',
    kg_baba_compra: 0,
    kg_segunda: 0
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarLotes();

    setTimeout(() => {
      this.cargarLotes();
    }, 500);
  }

  cargarLotes() {
    this.http.get<any[]>('/lotes')
      .subscribe(data => {
        console.log('LOTE DATA:', data);
        // Solo mostrar lotes recién ingresados (listos para fermentación)
        this.lotes = data.filter(l => l.estado === 'LISTO_PARA_FERMENTACION');
        this.cdr.detectChanges();
      });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    this.http.post('/lotes', this.nuevoLote)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Lote registrado correctamente';
          this.cargarLotes();
          this.cerrarModal();

          this.nuevoLote = {
            codigo: '',
            fecha_compra: '',
            proveedor_nombre: '',
            kg_baba_compra: 0,
            kg_segunda: 0
          };

          setTimeout(() => {
            this.mensajeExito = '';
          }, 3000);
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear lote');
        }
      });
  }

}