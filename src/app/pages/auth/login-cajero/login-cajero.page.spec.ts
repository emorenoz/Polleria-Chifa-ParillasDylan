import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginCajeroPage } from './login-cajero.page';

describe('LoginCajeroPage', () => {
  let component: LoginCajeroPage;
  let fixture: ComponentFixture<LoginCajeroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginCajeroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
