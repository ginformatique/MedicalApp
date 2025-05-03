import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorProfPage } from './doctor-prof.page';

describe('DoctorProfPage', () => {
  let component: DoctorProfPage;
  let fixture: ComponentFixture<DoctorProfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorProfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
