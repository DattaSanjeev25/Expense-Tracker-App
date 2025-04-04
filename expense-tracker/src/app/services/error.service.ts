import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(
    private snackBar: MatSnackBar,
    private loggingService: LoggingService
  ) {}

  handleError(error: HttpErrorResponse | Error): void {
    let errorMessage = 'An error occurred';
    let errorClass = 'error-snackbar';
    
    if (error instanceof HttpErrorResponse) {
      // Log detailed error information
      this.loggingService.error('HTTP Error Details:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
        headers: error.headers,
        name: error.name,
        message: error.message
      });

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
        this.loggingService.error('Client-side error:', error.error);
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            break;
          case 400:
            errorMessage = this.getValidationErrorMessage(error.error);
            errorClass = 'warning-snackbar';
            break;
          case 401:
            errorMessage = 'Your session has expired. Please log in again.';
            errorClass = 'warning-snackbar';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            errorClass = 'warning-snackbar';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            errorClass = 'warning-snackbar';
            break;
          case 409:
            errorMessage = 'A conflict occurred. Please try again.';
            errorClass = 'warning-snackbar';
            break;
          case 422:
            errorMessage = this.getValidationErrorMessage(error.error);
            errorClass = 'warning-snackbar';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            errorClass = 'warning-snackbar';
            break;
          case 500:
            errorMessage = this.getServerErrorMessage(error.error);
            this.loggingService.error('Server error details:', error.error);
            break;
          case 503:
            errorMessage = 'The service is temporarily unavailable. Please try again later.';
            break;
          case 504:
            errorMessage = 'The request timed out. Please try again.';
            break;
          default:
            errorMessage = error.error?.message || error.message || 'An unexpected error occurred';
        }
      }
    } else {
      // General error
      this.loggingService.error('Application Error:', error);
      errorMessage = error.message;
    }

    this.snackBar.open(errorMessage, 'Close', { 
      duration: 5000,
      panelClass: [errorClass]
    });
  }

  private getValidationErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.errors) {
      const messages = Object.values(error.errors).flat();
      return Array.isArray(messages) ? String(messages[0]) : String(messages);
    }
    
    return error.message || 'Invalid request. Please check your input.';
  }

  private getServerErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      return error.message;
    }

    if (error.error) {
      return error.error;
    }

    // Log the full error object for debugging
    this.loggingService.error('Unhandled server error format:', error);
    
    return 'An internal server error occurred. Please try again later.';
  }
} 