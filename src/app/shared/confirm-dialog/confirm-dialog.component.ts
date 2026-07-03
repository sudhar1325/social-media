import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ConfirmDialogData,
  ConfirmDialogService,
} from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {

  dialog: ConfirmDialogData | null = null;

  constructor(
    private confirmService: ConfirmDialogService
  ) {

    this.confirmService.dialog$.subscribe(dialog => {
      this.dialog = dialog;
    });

  }

  confirm() {

    this.dialog?.callback(true);

    this.dialog = null;

  }

  cancel() {

    this.dialog?.callback(false);

    this.dialog = null;

  }

}