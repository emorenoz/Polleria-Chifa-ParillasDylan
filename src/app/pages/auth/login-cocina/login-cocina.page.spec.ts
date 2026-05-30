import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginCocinaPage } from './login-cocina.page';

describe('LoginCocinaPage', () => {
  let component: LoginCocinaPage;
  let fixture: ComponentFixture<LoginCocinaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginCocinaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
