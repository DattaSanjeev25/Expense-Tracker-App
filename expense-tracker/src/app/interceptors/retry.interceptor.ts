import { HttpInterceptorFn } from '@angular/common/http';
import { retry, delay, Observable, throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';
import { inject } from '@angular/core';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const loggingService = inject(LoggingService);
  
  loggingService.debug('Making request with retry interceptor:', req.url);

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        loggingService.debug(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`, {
          url: req.url,
          error: error
        });

        // Don't retry if it's not a network error or if it's a 4xx error
        if (error.status && error.status >= 400 && error.status < 500) {
          loggingService.error('Request failed with client error, not retrying:', {
            status: error.status,
            url: req.url
          });
          return throwError(() => error);
        }

        // Calculate delay with exponential backoff
        const delayMs = INITIAL_DELAY * Math.pow(2, retryCount);
        loggingService.debug(`Waiting ${delayMs}ms before retry`);
        
        return new Observable(subscriber => {
          setTimeout(() => subscriber.next(0), delayMs);
        });
      }
    })
  );
}; 