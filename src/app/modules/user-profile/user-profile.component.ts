import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User, Post } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  posts: Post[] = [];
  loading = true;
  error = '';
  fileBase = environment.fileBaseUrl;

  // carousel state per post
  slideIndex: Record<string, number> = {};

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.loading = true;
      this.error = '';
      this.userService.getUserProfile(params['id']).subscribe({
        next: (res) => {
          this.user = res.user;
          this.posts = res.posts;
          res.posts.forEach((p) => (this.slideIndex[p._id] = 0));
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load profile';
          this.loading = false;
        },
      });
    });
  }

  avatarUrl(path?: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.fileBase}${path}`;
  }

  currentSlide(postId: string): number {
    return this.slideIndex[postId] ?? 0;
  }

  prevSlide(post: Post, event: Event) {
    event.stopPropagation();
    const total = post.mediaFiles?.length ?? 0;
    const cur = this.slideIndex[post._id] ?? 0;
    this.slideIndex[post._id] = (cur - 1 + total) % total;
  }

  nextSlide(post: Post, event: Event) {
    event.stopPropagation();
    const total = post.mediaFiles?.length ?? 0;
    const cur = this.slideIndex[post._id] ?? 0;
    this.slideIndex[post._id] = (cur + 1) % total;
  }

  goToSlide(post: Post, i: number) {
    this.slideIndex[post._id] = i;
  }
}