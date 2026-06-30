import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  posts: Post[] = [];
  fileBase = environment.fileBaseUrl;

  constructor(private postService: PostService, public auth: AuthService) {}

  ngOnInit() {
    this.postService.getMyPosts().subscribe((res) => (this.posts = res.posts));
  }

  remove(post: Post) {
    if (!confirm('Delete this post?')) return;
    this.postService.deletePost(post._id).subscribe(() => {
      this.posts = this.posts.filter((p) => p._id !== post._id);
    });
  }
}
