import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  public toasts$ = this.toasts.asReadonly();
  private nextId = 0;

  


  success(title: string, message?: string, duration: number = 4000, action?: ToastAction): void {
    this.show('success', title, message, duration, action);
  }

  


  error(title: string, message?: string, duration: number = 5000): void {
    this.show('error', title, message, duration);
  }

  


  warning(title: string, message?: string, duration: number = 4000): void {
    this.show('warning', title, message, duration);
  }

  


  info(title: string, message?: string, duration: number = 4000): void {
    this.show('info', title, message, duration);
  }

  


  private show(type: ToastType, title: string, message?: string, duration?: number, action?: ToastAction): void {
    const toast: Toast = {
      id: `toast-${++this.nextId}`,
      type,
      title,
      message,
      duration,
      action,
      timestamp: new Date()
    };

    
    this.toasts.update(toasts => [...toasts, toast]);

    
    if (duration && duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  


  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  


  clear(): void {
    this.toasts.set([]);
  }
}
