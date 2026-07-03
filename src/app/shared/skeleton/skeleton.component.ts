import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrls: ['./skeleton.component.scss']
})
export class SkeletonComponent {

  @Input() width = '100%';

  @Input() height = '16px';

  @Input() radius = '8px';

  @Input() circle = false;

  @Input() count = 1;

}