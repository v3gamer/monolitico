import { Component, Input } from '@angular/core';
import { RestApiServiceService } from '../../services/rest-api.service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-likes-number',
  imports: [CommonModule],
  templateUrl: './likes-number.component.html',
  styleUrl: './likes-number.component.scss'
})
export class LikesNumberComponent {
  @Input() 
  postId: number = 0;
  liked: boolean = false;
  likesNumber: number = 0;
  constructor(private api: RestApiServiceService) { }
  ngOnInit() {
    this.loadLikesNumber();
    this.checkLike();
  }
  loadLikesNumber() {
    this.api.getLikes(this.postId).subscribe((data: any) => {
      this.likesNumber = data.count;
    });
  }
  toggleLike() {
    this.api.toggleLike(this.postId).subscribe((data: any) => {
      this.liked = data.liked;
      this.loadLikesNumber();
    });
  }

  //check like
  checkLike() {
    this.api.checkLike(this.postId).subscribe((data: any) => {
      this.liked = data.liked;
    });
  }
}
