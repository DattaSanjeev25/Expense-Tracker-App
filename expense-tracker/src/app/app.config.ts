import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, retryInterceptor])
    ),
    provideAnimations(),
    provideClientHydration(),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    }
  ]
};
