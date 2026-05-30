import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidoDetallePage } from './pedido-detalle.page';

describe('PedidoDetallePage', () => {
  let component: PedidoDetallePage;
  let fixture: ComponentFixture<PedidoDetallePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoDetallePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
