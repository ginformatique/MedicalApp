// doctors.page.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

declare var google: any;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone :  false 
})
export class ProfilePage implements OnInit {
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }
}