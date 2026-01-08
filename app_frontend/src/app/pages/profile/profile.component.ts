import { Component, OnInit } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule] // necesario para *ngIf
})
export class ProfileComponent implements OnInit {
  profile: {
    message: string,
    user: {
      id: number,
      username: string,
      role: string,
      iat: number,
      exp: number
    }
  } | null = null;

  constructor(private restApiService: RestApiServiceService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.restApiService.getProfile().subscribe((data) => {
      this.profile = data;
    });
  }
}
