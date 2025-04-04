import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggingService } from '../services/logging.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loggingService = inject(LoggingService);
  
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } else {
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
  }

  loggingService.debug('Making request to:', req.url);

  return next(req).pipe(
    catchError((error) => {
      loggingService.error('Request failed:', error);
      
      if (error.status === 0) {
        loggingService.error('Server connection failed. Please check if the server is running.');
        return throwError(() => ({ 
          message: 'Unable to connect to the server. Please check if the server is running.' 
        }));
      }
      
      if (error.status === 401) {
        loggingService.debug('Unauthorized access, logging out user');
        authService.logout();
        router.navigate(['/auth']);
      }
      
      return throwError(() => error);
    })
  );
}; 