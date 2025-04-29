import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalDocumentPage } from './medical-document.page';

describe('MedicalDocumentPage', () => {
  let component: MedicalDocumentPage;
  let fixture: ComponentFixture<MedicalDocumentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicalDocumentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
