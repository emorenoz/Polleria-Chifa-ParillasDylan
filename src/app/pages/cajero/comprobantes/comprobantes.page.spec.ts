import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComprobantesPage } from './comprobantes.page';

describe('ComprobantesPage', () => {
  let component: ComprobantesPage;
  let fixture: ComponentFixture<ComprobantesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComprobantesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
