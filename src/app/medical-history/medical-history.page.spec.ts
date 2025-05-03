import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalHistoryPage } from './medical-history.page';

describe('MedicalHistoryPage', () => {
  let component: MedicalHistoryPage;
  let fixture: ComponentFixture<MedicalHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicalHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
