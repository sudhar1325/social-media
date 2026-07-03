import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss']
})
export class LightboxComponent {

  opened = false;

  images: string[] = [];

  index = 0;

  open(images: string[], start: number) {
    this.images = images;
    this.index = start;
    this.opened = true;
  }

  close() {
    this.opened = false;
  }

  next() {
    this.index =
      (this.index + 1) % this.images.length;
  }

  prev() {
    this.index =
      (this.index - 1 + this.images.length)
      % this.images.length;
  }

  @HostListener('window:keydown.escape')
  esc() {
    this.close();
  }

}