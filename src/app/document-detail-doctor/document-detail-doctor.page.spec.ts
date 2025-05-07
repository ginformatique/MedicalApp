import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentDetailDoctorPage } from './document-detail-doctor.page';

describe('DocumentDetailDoctorPage', () => {
  let component: DocumentDetailDoctorPage;
  let fixture: ComponentFixture<DocumentDetailDoctorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentDetailDoctorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
