import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmDialogData{
  title:string;
  message:string;
  confirmText:string;
  cancelText:string;
  callback:(confirmed:boolean)=>void;
}

@Injectable({
  providedIn:'root'
})
export class ConfirmDialogService{

  dialog$=new Subject<ConfirmDialogData|null>();

  open(
    title:string,
    message:string,
    callback:(confirmed:boolean)=>void,
    confirmText='Confirm',
    cancelText='Cancel'
  ){

    this.dialog$.next({
      title,
      message,
      callback,
      confirmText,
      cancelText
    });

  }

}