import { Component, OnInit,inject } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LikesNumberComponent } from '../../compenents/likes-number/likes-number.component';
import { CommentsComponent } from '../../compenents/comments/comments.component';



@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, LikesNumberComponent, CommentsComponent] // CommonModule para *ngFor, RouterModule para routerLink
})
export class HomeComponent implements OnInit {
  title = 'frontend';
  posts: any[] = [];
  comentariosVisibles: { [postId: string]: boolean } = {};

  protected readonly auth = inject(RestApiServiceService);

  constructor(private api: RestApiServiceService) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.api.getPosts().subscribe((data) => {
      this.posts = data;
    });
  }
  deletePost(postId: string) {
    this.api.deletePost(postId).subscribe((response) => {
      console.log('Post deleted successfully:', response);
      // Aquí puedes agregar lógica adicional después de eliminar el post, como actualizar la lista de posts
      this.loadPosts();
    }); 
  }

  toggleComentarios(postId: string) {
    this.comentariosVisibles[postId] = !this.comentariosVisibles[postId];
  }
}
