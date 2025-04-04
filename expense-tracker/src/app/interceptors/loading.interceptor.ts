import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { ErrorService } from '../services/error.service';
import { LoggingService } from '../services/logging.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

let totalRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const errorService = inject(ErrorService);
  const loggingService = inject(LoggingService);
  
  // Don't show loading for background requests
  if (req.headers.has('X-Background-Request')) {
    loggingService.debug('Background request:', {
      url: req.url,
      method: req.method,
      headers: req.headers
    });
    return next(req);
  }
  
  totalRequests++;
  loadingService.show();
  
  // Log request details
  loggingService.debug('Request details:', {
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    activeRequests: totalRequests
  });

  return next(req).pipe(
    catchError((error) => {
      loggingService.error('Request failed:', {
        url: req.url,
        method: req.method,
        error: error,
        requestBody: req.body
      });
      errorService.handleError(error);
      return throwError(() => error);
    }),
    finalize(() => {
      totalRequests--;
      loggingService.debug('Request completed:', {
        url: req.url,
        method: req.method,
        activeRequests: totalRequests
      });
      if (totalRequests === 0) {
        loadingService.hide();
      }
    })
  );
}; 