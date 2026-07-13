import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionarMeseroPage } from './seleccionar-mesero.page';

describe('SeleccionarMeseroPage', () => {
  let component: SeleccionarMeseroPage;
  let fixture: ComponentFixture<SeleccionarMeseroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarMeseroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
