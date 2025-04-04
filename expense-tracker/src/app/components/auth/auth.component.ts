import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loggingService: LoggingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/transactions']);
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit(): void {
    if (this.isLoading) return;

    const form = this.isLoginMode ? this.loginForm : this.registerForm;
    if (!form.valid) {
      this.loggingService.warn('Form validation failed:', form.errors);
      return;
    }

    this.isLoading = true;
    const request = this.isLoginMode
      ? this.authService.login(form.value)
      : this.authService.register(form.value);

    request.subscribe({
      next: () => {
        this.router.navigate(['/transactions']);
        this.snackBar.open(
          this.isLoginMode ? 'Successfully logged in' : 'Successfully registered',
          'Close',
          { duration: 3000 }
        );
      },
      error: (error) => {
        this.loggingService.error('Authentication error:', error);
        this.snackBar.open(
          error.message || 'An error occurred during authentication',
          'Close',
          { duration: 5000 }
        );
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
} 