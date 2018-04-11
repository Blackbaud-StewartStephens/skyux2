import { Component, OnInit } from '@angular/core';
import { SkyToastService } from './toast.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'sky-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class SkyToastContainerComponent implements OnInit {

  messages: Observable<any>;

  constructor(private toast: SkyToastService) { }

  ngOnInit() {
    this.messages = this.toast.getMessages
  }
}