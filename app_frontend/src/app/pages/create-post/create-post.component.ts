import { Component } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent {
  constructor(private api: RestApiServiceService, private router: Router) { }

  content: string = '';
  
  createPost()  {
    this.api.createPost(this.content).subscribe({
      next: (response) => {
        console.log('Post created:', response);
        this.content = '';
        //si la respuesta es valida redirigiremos a home
        if (response.id) {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Error creating post:', error);
      }
    
    });
  }

}
