import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionarCocinaPage } from './seleccionar-cocina.page';

describe('SeleccionarCocinaPage', () => {
  let component: SeleccionarCocinaPage;
  let fixture: ComponentFixture<SeleccionarCocinaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarCocinaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
