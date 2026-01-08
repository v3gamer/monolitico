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
  constructor(private api: RestApiServiceService) {}

  ngOnInit() {
    this.loadComments();
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
}
