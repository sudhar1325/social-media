import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { Post, User } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';
import { ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { LightboxComponent } from '../../shared/lightbox/lightbox.component';
import { LoadingService } from '../../core/services/loading.service';
import { Subject, debounceTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SkeletonComponent,
    LightboxComponent,
  ],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss',
})
export class FeedComponent implements OnInit, AfterViewInit, OnDestroy {
  posts: Post[] = [];
  page = 1;
  totalPages = 1;
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
  // Report Modal
  reportModalOpen = false;
  selectedPost!: Post;
  selectedReason = 'Spam';
  otherReason = '';

  reportReasons = [
    'Spam',
    'Harassment',
    'Violence',
    'Adult Content',
    'Copyright',
    'Other',
  ];
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  private toastTimer: any;
  likedPosts = new Set<string>();
  initialLoading = true;
  loadingMore = false;
  @ViewChild('scrollTrigger')
  scrollTrigger!: ElementRef;
  @ViewChild('lightbox')
  lightbox!: LightboxComponent;

  openLightbox(post: any, index: number) {
    const images = post.mediaFiles
      .filter((m: any) => m.type === 'image')
      .map((m: any) => this.fileBase + m.url);
    const imageIndex = post.mediaFiles
      .filter((m: { type: string }) => m.type === 'image')
      .findIndex((m: { url: any }) => m.url === post.mediaFiles[index].url);
    this.lightbox.open(images, imageIndex);
    this.lightbox.open(images, index);
  }

  openSingle(post: any) {
    this.lightbox.open([this.fileBase + post.mediaURL], 0);
  }

  private searchSubject = new Subject<string>();
  private observer!: IntersectionObserver;
  constructor(
    private postService: PostService,
    public loading: LoadingService,
    private authService: AuthService,
  ) {
    console.log('Current User:', this.authService.currentUser());
  }

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.searchLive();
    });
    this.fetch();
  }

  fetch(reset = false) {
    if (reset) {
      this.page = 1;
      this.posts = [];
      this.filteredPosts = [];
    }
    if (this.page === 1) {
      this.initialLoading = true;
    } else {
      this.loadingMore = true;
    }
    this.postService.getFeed(this.page, 10, this.searchText).subscribe({
      next: (res) => {
        if (this.page === 1) {
          this.posts = res.posts;
        } else {
          this.posts = [...this.posts, ...res.posts];
        }
        this.filteredPosts = [...this.posts];
        this.totalPages = res.totalPages;

        this.initialLoading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.initialLoading = false;
        this.loadingMore = false;
        this.showToast('Unable to load posts', 'error');
      },
    });
  }

  loadMore() {
    if (this.loadingMore) return;
    if (this.page >= this.totalPages) return;
    this.page++;
    if (this.searchText.trim()) {
      this.postService
        .searchPosts(this.searchText, this.page)
        .subscribe((res) => {
          this.filteredPosts = [...this.filteredPosts, ...res.posts];
        });
    } else {
      this.fetch();
    }
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
    console.log(this.currentSlide(post._id));
    const total = post.mediaFiles?.length ?? 0;
    const current = this.slideIndex[post._id] ?? 0;
    this.slideIndex[post._id] = (current + 1) % total;
    console.log(this.currentSlide(post._id));
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
      error: () => {
        this.showToast('Something went wrong', 'error');
      },
    });
  }
  // ── Comments ───────────────────────────────────────────────
  isMyComment(post: any, comment: any): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    const currentId = String(
      (currentUser as any)._id || (currentUser as any).id,
    );
    const commentOwnerId = String(
      typeof comment.userId === 'object'
        ? (comment.userId as any)._id || (comment.userId as any).id
        : comment.userId,
    );
    const postOwnerId = String(
      typeof post.userId === 'object'
        ? (post.userId as any)._id || (post.userId as any).id
        : post.userId,
    );
    // Comment owner OR Post owner can delete
    return currentId === commentOwnerId || currentId === postOwnerId;
  }
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
    this.postService.addComment(post._id, text).subscribe({
      next: (res) => {
        this.comments[post._id] = [
          ...(this.comments[post._id] || []),
          res.comment,
        ];
        post.commentCount++;
        this.newComment[post._id] = '';
        this.showToast('Comment added', 'success');
      },
      error: () => {
        this.showToast('Unable to add comment', 'error');
      },
    });
  }
  deleteComment(post: Post, comment: any) {
    if (!confirm('Delete this comment?')) {
      return;
    }
    this.postService.deleteComment(comment._id).subscribe({
      next: () => {
        this.comments[post._id] = this.comments[post._id].filter(
          (c) => c._id !== comment._id,
        );
        post.commentCount = Math.max(0, post.commentCount - 1);
        this.showToast('Comment deleted successfully', 'success');
      },
      error: (err) => {
        this.showToast(
          err.error?.message || 'Failed to delete comment',
          'error',
        );
      },
    });
  }
  deleteModalOpen = false;
  selectedComment: any;
  openDeleteModal(post: Post, comment: any) {
    this.selectedPost = post;
    this.selectedComment = comment;
    this.deleteModalOpen = true;
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
  }

  confirmDeleteComment() {
    this.postService.deleteComment(this.selectedComment._id).subscribe({
      next: () => {
        this.comments[this.selectedPost._id] = this.comments[
          this.selectedPost._id
        ].filter((c) => c._id !== this.selectedComment._id);
        this.selectedPost.commentCount--;
        this.showToast('Comment deleted successfully', 'success');
        this.closeDeleteModal();
      },
      error: () => {
        this.showToast('Failed to delete comment', 'error');
      },
    });
  }

  openReportModal(post: Post) {
    this.selectedPost = post;
    this.selectedReason = 'Spam';
    this.otherReason = '';
    this.reportModalOpen = true;
  }

  closeReportModal() {
    this.reportModalOpen = false;
  }

  submitReport() {
    let reason = this.selectedReason;
    if (reason === 'Other') {
      reason = this.otherReason.trim();
    }
    if (!reason) return;
    this.postService.reportPost(this.selectedPost._id, reason).subscribe({
      next: () => {
        this.showToast('Report submitted successfully', 'success');
      },
      error: () => {
        this.showToast('Failed to submit report', 'error');
      },
    });
  }

  searchLive() {
    this.page = 1;
    this.posts = [];
    this.filteredPosts = [];

    this.fetch();
  }

  onSearchInput() {
    if (!this.searchText.trim()) {
      this.clearSearch();
      return;
    }

    this.searchSubject.next(this.searchText);
  }

  private searchTimer: any;
  clearSearch() {
    this.searchText = '';
    this.page = 1;
    this.posts = [];
    this.filteredPosts = [];
    this.fetch();
  }
  showToast(
    message: string,
    type: 'success' | 'error' | 'warning' = 'success',
  ) {
    clearTimeout(this.toastTimer);

    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  ngAfterViewInit(): void {
    this.createObserver();
  }
  createObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !this.loadingMore &&
          !this.initialLoading &&
          this.page < this.totalPages
        ) {
          this.page++;
          this.fetch();
        }
      },
      {
        root: null,
        threshold: 0.2,
      },
    );
    this.observer.observe(this.scrollTrigger.nativeElement);
  }
  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
