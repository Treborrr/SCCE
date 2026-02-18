import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lotes.html',
  styleUrls: ['./lotes.scss']
})
export class Lotes implements OnInit {

  lotes: any[] = [];
  mostrarModal = false;

  nuevoLote = {
    codigo: '',
    fecha_compra: '',
    nombre_proveedor: '',
    kg_baba_compra: 0,
    kg_segunda: 0
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarLotes();
  }

  cargarLotes() {
    this.http.get<any[]>('http://localhost:3000/lotes')
      .subscribe(data => this.lotes = data);
  }

  abrirNuevo() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardar() {
    this.http.post('http://localhost:3000/lotes', this.nuevoLote)
      .subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarLotes();
          this.nuevoLote = {
            codigo: '',
            fecha_compra: '',
            nombre_proveedor: '',
            kg_baba_compra: 0,
            kg_segunda: 0
          };
        },
        error: () => alert('Error al crear lote')
      });
  }
}