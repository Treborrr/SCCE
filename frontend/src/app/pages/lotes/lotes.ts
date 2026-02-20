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
    proveedor: '',
    kg_baba_compra: 0,
    kg_segunda: 0
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarLotes();

    setTimeout(() => {
      this.cargarLotes();
    }, 500);
  }
  
  cargarLotes() {
    this.http.get<any[]>('http://localhost:3000/lotes')
      .subscribe(data => {
        console.log('LOTE DATA:', data);
        this.lotes = [...data]; 

        this.cdr.detectChanges(); // recarga el componente para mostrar los datos actualizados
      });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    this.http.post('http://localhost:3000/lotes', this.nuevoLote)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Lote registrado correctamente';
          this.cargarLotes();
          this.cerrarModal();

          this.nuevoLote = {
            codigo: '',
            fecha_compra: '',
            proveedor: '',
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

  pasarAFermentacion(id: string) {
    this.http.patch(`http://localhost:3000/lotes/${id}/listo-fermentacion`, {
      estado: 'LISTO_PARA_FERMENTACION'
    }).subscribe(() => {
      this.cargarLotes();
    });
  }

}