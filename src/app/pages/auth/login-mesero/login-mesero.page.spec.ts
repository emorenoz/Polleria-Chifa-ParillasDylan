import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginMeseroPage } from './login-mesero.page';

describe('LoginMeseroPage', () => {
  let component: LoginMeseroPage;
  let fixture: ComponentFixture<LoginMeseroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginMeseroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
