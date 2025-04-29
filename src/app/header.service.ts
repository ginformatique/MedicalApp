// shared/
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private showHeader = new BehaviorSubject<boolean>(true);
  showHeader$ = this.showHeader.asObservable();

  hide() { this.showHeader.next(false); }
  show() { this.showHeader.next(true); }
}