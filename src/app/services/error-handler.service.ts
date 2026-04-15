import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toastr = inject(ToastrService);
  private readonly zone = inject(NgZone);

  handleError(error: any): void {
    // Log the error to the console with formatting
    this.logToConsole(error);

    // Show a user-friendly message using Toastr
    // We run this inside the zone to ensure it updates the UI correctly
    this.zone.run(() => {
      let message = 'Ocurrió un error inesperado.';
      let title = 'Error del Sistema';

      if (error instanceof HttpErrorResponse) {
        // Handle HTTP errors specifically
        message = error.error?.message || error.message || 'Error de conexión con el servidor.';
        title = `Error ${error.status}: ${error.statusText}`;
      } else if (error instanceof Error) {
        // Handle standard JavaScript/TypeScript errors
        message = error.message;
      }

      this.toastr.error(message, title, {
        timeOut: 5000,
        progressBar: true,
        closeButton: true
      });
    });
  }

  private logToConsole(error: any): void {
    const timestamp = new Date().toISOString();
    
    console.group(`%c [ERROR LOG] ${timestamp} `, 'background: #ff0000; color: #ffffff; font-weight: bold; padding: 2px 4px; border-radius: 2px;');
    
    if (error instanceof HttpErrorResponse) {
      console.error('%cType:%c HTTP Error', 'font-weight: bold', '');
      console.error('%cStatus:%c', 'font-weight: bold', '', error.status, error.statusText);
      console.error('%cURL:%c', 'font-weight: bold', '', error.url);
      console.error('%cMessage:%c', 'font-weight: bold', '', error.message);
      if (error.error) {
        console.error('%cBody:%c', 'font-weight: bold', '', error.error);
      }
    } else if (error instanceof Error) {
      console.error('%cType:%c Runtime Error', 'font-weight: bold', '');
      console.error('%cMessage:%c', 'font-weight: bold', '', error.message);
      console.error('%cStack Trace:%c', 'font-weight: bold', '', error.stack);
    } else {
      console.error('%cRaw Error:%c', 'font-weight: bold', '', error);
    }

    console.groupEnd();
  }
}
