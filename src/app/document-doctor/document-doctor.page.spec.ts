import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentDoctorPage } from './document-doctor.page';

describe('DocumentDoctorPage', () => {
  let component: DocumentDoctorPage;
  let fixture: ComponentFixture<DocumentDoctorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentDoctorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
