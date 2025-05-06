import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RendezvousPage } from './rendezvous.page';

describe('RendezvousPage', () => {
  let component: RendezvousPage;
  let fixture: ComponentFixture<RendezvousPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RendezvousPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
