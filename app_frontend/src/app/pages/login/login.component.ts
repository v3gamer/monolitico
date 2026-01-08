import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule] // CommonModule para *ngIf, FormsModule para ngModel
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private api: RestApiServiceService, private router: Router) {}

  async onLogin() {
    try {
      const result = await firstValueFrom(this.api.login(this.username, this.password));
      console.log('Login successful', result);
      this.router.navigate(['/profile']);
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage = 'Login failed. Please check your credentials.';
    }
  }
}
