import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectRolePage } from './select-role.page';

describe('SelectRolePage', () => {
  let component: SelectRolePage;
  let fixture: ComponentFixture<SelectRolePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectRolePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
