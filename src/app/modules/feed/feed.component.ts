import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { Post, User } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  page = 1;
  totalPages = 1;
  loading = false;
  fileBase = environment.fileBaseUrl;
  searchText = '';
  filteredPosts: Post[] = [];
  filters = {
    mediaType: '',
    category: '',
  };
  slideIndex: Record<string, number> = {};
  openComments: Record<string, boolean> = {};
  comments: Record<string, any[]> = {};
  newComment: Record<string, string> = {};
  likedPosts = new Set<string>();

  constructor(private postService: PostService) {}

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.postService.getFeed(this.page).subscribe({
      next: (res) => {
            this.posts = [...this.posts, ...res.posts];
            this.filteredPosts = this.posts;
            this.totalPages = res.totalPages;
            this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMore() {
    this.page++;
    this.fetch();
  }

  // ── Author helpers ─────────────────────────────────────────
  authorName(item: any): string {
    const u = item.userId as User;
    return typeof u === 'object' ? u.username : 'unknown';
  }

  getAuthorId(post: Post): string {
    const u = post.userId as User;
    return typeof u === 'object' ? u._id : (post.userId as string);
  }

  getAuthorImage(post: Post): string {
    const u = post.userId as User;
    return typeof u === 'object' ? u.profileImage || '' : '';
  }

  avatarUrl(path: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.fileBase}${path}`;
  }

  // ── Carousel ───────────────────────────────────────────────
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

  // ── Likes ──────────────────────────────────────────────────
  toggleLike(post: Post) {
    const action = this.likedPosts.has(post._id)
      ? this.postService.unlike(post._id)
      : this.postService.like(post._id);
    action.subscribe({
      next: (res) => {
        post.likeCount = res.likeCount;
        if (this.likedPosts.has(post._id)) this.likedPosts.delete(post._id);
        else this.likedPosts.add(post._id);
      },
    });
  }

  // ── Comments ───────────────────────────────────────────────
  toggleComments(post: Post) {
    this.openComments[post._id] = !this.openComments[post._id];
    if (this.openComments[post._id] && !this.comments[post._id]) {
      this.postService.getComments(post._id).subscribe((res) => {
        this.comments[post._id] = res.comments;
      });
    }
  }

  submitComment(post: Post) {
    const text = this.newComment[post._id];
    if (!text) return;
    this.postService.addComment(post._id, text).subscribe((res) => {
      this.comments[post._id] = [
        ...(this.comments[post._id] || []),
        res.comment,
      ];
      post.commentCount++;
      this.newComment[post._id] = '';
    });
  }

  report(post: Post) {
    const reason = prompt('Why are you reporting this post?');
    if (!reason) return;
    this.postService
      .reportPost(post._id, reason)
      .subscribe(() => alert('Report submitted'));
  }

  searchLive() {
    const value = this.searchText.toLowerCase().trim();

    if (!value) {
      this.filteredPosts = this.posts;
      return;
    }

    this.filteredPosts = this.posts.filter((post) => {
      const username =
        typeof post.userId === 'object'
          ? post.userId.username?.toLowerCase() || ''
          : '';

      const description = post.description?.toLowerCase() || '';
      const category = post.category?.toLowerCase() || '';

      return (
        username.includes(value) ||
        description.includes(value) ||
        category.includes(value)
      );
    });
  }
}
