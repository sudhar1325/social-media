import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {

  private toasts = new BehaviorSubject<Toast[]>([]);

  toasts$ = this.toasts.asObservable();

  private id = 0;

  show(
    type: Toast['type'],
    title: string,
    message: string,
    duration = 3000
  ) {

    const toast: Toast = {
      id: ++this.id,
      type,
      title,
      message,
    };

    this.toasts.next([
      ...this.toasts.value,
      toast,
    ]);

    setTimeout(() => {
      this.remove(toast.id);
    }, duration);

  }

  success(title: string, message: string) {
    this.show('success', title, message);
  }

  error(title: string, message: string) {
    this.show('error', title, message);
  }

  warning(title: string, message: string) {
    this.show('warning', title, message);
  }

  info(title: string, message: string) {
    this.show('info', title, message);
  }

  remove(id: number) {
    this.toasts.next(
      this.toasts.value.filter(t => t.id !== id)
    );
  }

}