import { Component, Input } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comments',
  imports: [FormsModule, CommonModule],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent {
  @Input() postId: number = 0;
  newCommentContent: string = '';
  commentsList: any[] = [];
  currentUser: string = ''; // Variable para almacenar el nombre del usuario actual
  currentUserId!: number;

  constructor(private api: RestApiServiceService) {}

  ngOnInit() {
    this.loadComments();
    this.getCurrentUserId();
  }

    // Obtener ID del usuario desde el token
  getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = payload.user.id;
    }
  }

  loadComments() {
    this.api.getComments(this.postId).subscribe((data) => {
      console.log('COMMENTS' , data);
      this.commentsList = data;
    })
  }

  addComment() {
    // Lógica para agregar un nuevo comentario usando this.newCommentContent
    this.api.createComment(this.postId.toString(), this.newCommentContent).subscribe((response) => {
      console.log('Comment added successfully:', response);
      this.newCommentContent = '';
      this.loadComments();
    });
  }

  //borrar comentario solo si es el dueño 
   deleteComment(commentId: string) {
    this.api.deleteComment(commentId).subscribe(() => {
      this.loadComments();
    });
  }
}
