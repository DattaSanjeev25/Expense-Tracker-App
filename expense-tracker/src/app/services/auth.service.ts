import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user';
import { environment } from '../../environments/environment';
import { LoggingService } from './logging.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const user = this.getLocalStorageItem('user');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  private getLocalStorageItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      this.loggingService.error('Error accessing localStorage:', error);
      return null;
    }
  }

  private setLocalStorageItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      this.loggingService.error('Error setting localStorage:', error);
    }
  }

  private removeLocalStorageItem(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.loggingService.error('Error removing from localStorage:', error);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getLocalStorageItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Unable to connect to the server. Please check if the server is running.';
      this.loggingService.error('Client-side error:', {
        message: error.error.message,
        type: error.error.type,
        target: error.error.target
      });
    } else {
      // Server-side error
      this.loggingService.error('Server error details:', {
        status: error.status,
        statusText: error.statusText,
        error: error.error
      });
      
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check if the server is running.';
          break;
        case 400:
          errorMessage = error.error.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found. The requested endpoint does not exist.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error.message || 'An unexpected error occurred. Please try again.';
      }
    }
    
    return throwError(() => ({ message: errorMessage }));
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setLocalStorageItem('token', response.token);
          this.setLocalStorageItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.setLocalStorageItem('token', response.token);
          this.setLocalStorageItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.removeLocalStorageItem('token');
    this.removeLocalStorageItem('user');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  isAuthenticated(): boolean {
    return !!this.getLocalStorageItem('token');
  }

  getToken(): string | null {
    return this.getLocalStorageItem('token');
  }
} 