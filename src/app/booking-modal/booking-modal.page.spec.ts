import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingModalPage } from './booking-modal.page';

describe('BookingModalPage', () => {
  let component: BookingModalPage;
  let fixture: ComponentFixture<BookingModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
