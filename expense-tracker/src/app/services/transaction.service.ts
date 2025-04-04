import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Transaction, TransactionFilter } from '../models/transaction';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/api/transaction`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loggingService: LoggingService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.loggingService.error('No authentication token found');
      throw new Error('Authentication required');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
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
          errorMessage = 'Your session has expired. Please log in again.';
          this.authService.logout();
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

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getFilteredTransactions(filter: TransactionFilter): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/filter`, { 
      headers: this.getHeaders(),
      params: {
        startDate: filter.startDate?.toISOString() || '',
        endDate: filter.endDate?.toISOString() || '',
        month: filter.month?.toString() || '',
        year: filter.year?.toString() || ''
      }
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction, { headers: this.getHeaders() })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getBalance(): Observable<number> {
    return this.http.get<{ balance: number }>(`${this.apiUrl}/balance`, { headers: this.getHeaders() })
      .pipe(
        retry(1),
        map(response => response.balance),
        catchError(this.handleError)
      );
  }
} 