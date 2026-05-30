import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidosActivosPage } from './pedidos-activos.page';

describe('PedidosActivosPage', () => {
  let component: PedidosActivosPage;
  let fixture: ComponentFixture<PedidosActivosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidosActivosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
