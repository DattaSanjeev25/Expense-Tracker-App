import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private isDevelopment = !environment.production;

  constructor() {
    // Initialize logging service
    if (this.isDevelopment) {
      console.log('LoggingService initialized in development mode');
    }
  }

  log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      try {
        console.log(`[${new Date().toISOString()}] ${message}`, ...args);
      } catch (error) {
        console.error('Error in logging service:', error);
      }
    }
  }

  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      try {
        if (error instanceof Error) {
          console.error(`[${new Date().toISOString()}] ${message}`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else if (error && typeof error === 'object') {
          console.error(`[${new Date().toISOString()}] ${message}`, JSON.stringify(error, null, 2));
        } else {
          console.error(`[${new Date().toISOString()}] ${message}`, error);
        }
      } catch (loggingError) {
        console.error('Error in logging service:', loggingError);
      }
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      try {
        console.warn(`[${new Date().toISOString()}] ${message}`, ...args);
      } catch (error) {
        console.error('Error in logging service:', error);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      try {
        console.debug(`[${new Date().toISOString()}] ${message}`, ...args);
      } catch (error) {
        console.error('Error in logging service:', error);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      try {
        console.info(`[${new Date().toISOString()}] ${message}`, ...args);
      } catch (error) {
        console.error('Error in logging service:', error);
      }
    }
  }
} 