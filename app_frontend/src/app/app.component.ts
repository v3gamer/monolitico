import { Component, inject, OnInit } from '@angular/core';
import { RestApiServiceService } from './services/rest-api.service.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule] // necesario para *ngFor, *ngIf
})
export class AppComponent implements OnInit {
  posts: any[] = [];
  protected readonly title = 'app_frontend';
  protected readonly router = inject(Router);
  protected readonly auth = inject(RestApiServiceService);

  constructor(private api: RestApiServiceService) { }

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.api.getPosts().subscribe((data) => {
      this.posts = data;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
