import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  submitted = false;
  successMessage = '';

  constructor(private auth: AuthService) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.submitted = true;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      },
    });
  }
}
