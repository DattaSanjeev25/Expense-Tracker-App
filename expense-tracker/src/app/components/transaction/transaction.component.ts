import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, TransactionFilter, TransactionType } from '../../models/transaction';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  filterForm: FormGroup;
  transactions: Transaction[] = [];
  balance: number = 0;
  isLoading = false;
  displayedColumns: string[] = ['date', 'description', 'amount', 'actions'];
  protected readonly TransactionType = TransactionType;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.transactionForm = this.fb.group({
      date: [new Date(), Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      isCredit: [false]
    });

    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      month: [null],
      year: [null]
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadBalance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.snackBar.open(error.message || 'Error loading transactions', 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  loadBalance(): void {
    this.transactionService.getBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balance) => {
          this.balance = balance;
        },
        error: (error) => {
          console.error('Error loading balance:', error);
          this.snackBar.open(error.message || 'Error loading balance', 'Close', { duration: 5000 });
        }
      });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.isLoading = true;
      const formValue = this.transactionForm.value;
      
      this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
        if (!user?.id) {
          this.snackBar.open('Please log in to add transactions', 'Close', { duration: 5000 });
          this.isLoading = false;
          return;
        }
        const rawDate = new Date(formValue.date);

        const localDate = new Date(rawDate.getTime() - rawDate.getTimezoneOffset() * 60000);

        const transaction: Omit<Transaction, 'id' | 'updatedAt'> = {
          amount: Number(formValue.amount),
          description: formValue.description.trim(),
          type: formValue.isCredit ? TransactionType.Income : TransactionType.Expense,
          userId: user.id,
          createdAt: localDate
        };
        
        this.transactionService.createTransaction(transaction)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.snackBar.open('Transaction added successfully', 'Close', { duration: 3000 });
              this.transactionForm.reset({
                date: new Date(),
                amount: '',
                description: '',
                isCredit: false
              });
              this.loadTransactions();
              this.loadBalance();
            },
            error: (error) => {
              console.error('Error creating transaction:', error);
              this.snackBar.open(error.message || 'Error adding transaction', 'Close', { duration: 5000 });
            },
            complete: () => {
              this.isLoading = false;
            }
          });
      });
    } else {
      this.markFormGroupTouched(this.transactionForm);
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
    }
  }

  applyFilter(): void {
    if (this.filterForm.valid) {
      this.isLoading = true;
      const filter: TransactionFilter = this.filterForm.value;
      
      this.transactionService.getFilteredTransactions(filter)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (transactions) => {
            this.transactions = transactions;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error applying filter:', error);
            this.snackBar.open(error.message || 'Error applying filter', 'Close', { duration: 5000 });
            this.isLoading = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.filterForm);
      this.snackBar.open('Please fill in the filter fields correctly', 'Close', { duration: 3000 });
    }
  }

  deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.isLoading = true;
      this.transactionService.deleteTransaction(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Transaction deleted successfully', 'Close', { duration: 3000 });
            this.loadTransactions();
            this.loadBalance();
          },
          error: (error) => {
            console.error('Error deleting transaction:', error);
            this.snackBar.open(error.message || 'Error deleting transaction', 'Close', { duration: 5000 });
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
  }

  formatAmount(amount: number, type: TransactionType): string {
    return `${type === TransactionType.Income ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.transactionForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('min')) {
      return 'Amount must be greater than 0';
    }
    if (control?.hasError('minlength')) {
      return 'Description must be at least 3 characters long';
    }
    return '';
  }
} 