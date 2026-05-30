import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CobrarPage } from './cobrar.page';

describe('CobrarPage', () => {
  let component: CobrarPage;
  let fixture: ComponentFixture<CobrarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CobrarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
