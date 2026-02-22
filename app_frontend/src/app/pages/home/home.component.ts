import { Component, OnInit, inject } from '@angular/core';
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
  imports: [CommonModule, RouterModule, LikesNumberComponent, CommentsComponent]
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
    this.api.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: (err) => {
        console.error('Error cargando posts:', err);
      }
    });
  }

  toggleComentarios(postId: string) {
    this.comentariosVisibles[postId] = !this.comentariosVisibles[postId];
  }

  deletePost(postId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;

    this.api.deletePost(postId).subscribe({
      next: (response) => {
        console.log('Post eliminado correctamente:', response);
        // Actualiza la lista sin recargar todo
        this.posts = this.posts.filter(post => post.id !== postId);
      },
      error: (err) => {
        console.error('Error al eliminar post:', err);
        alert(err.error?.error || 'Error eliminando el post');
      }
    });
  }
}
