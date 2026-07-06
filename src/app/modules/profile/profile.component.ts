import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/post.service';
import { UserService } from '../../core/services/user.service';
import { Post, User } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { LightboxComponent } from '../../shared/lightbox/lightbox.component';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LightboxComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  posts: Post[] = [];
  loadError = '';
  fileBase = environment.fileBaseUrl;

  // Edit modal state
  editOpen = false;
  editBio = '';
  avatarFile: File | null = null;
  avatarPreview: string | null = null;
  saving = false;
  saveError = '';

  constructor(
    private postService: PostService,
    private userService: UserService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
  ) {}

  @ViewChild('lightbox')
  lightbox!: LightboxComponent;

  openLightbox(post: any, selectedMedia: any) {
    const images = post.mediaFiles
      .filter((m: any) => m.type === 'image')
      .map((m: any) => this.fileBase + m.url);

    const index = post.mediaFiles
      .filter((m: any) => m.type === 'image')
      .findIndex((m: any) => m.url === selectedMedia.url);

    this.lightbox.open(images, index);
  }
  ngOnInit() {
    this.loadProfile();
    this.postService.getMyPosts().subscribe((res) => (this.posts = res.posts));
  }

  loadProfile() {
    this.userService.getProfile().subscribe({
      next: (res) => (this.user = res.user),
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loadError = err.error?.message || 'Could not load profile details';
      },
    });
  }

  avatarUrl(path?: string): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.fileBase}${path}`;
  }

  openEdit() {
    if (!this.user) return;
    this.editBio = this.user.bio || '';
    this.avatarFile = null;
    this.avatarPreview = null;
    this.saveError = '';
    this.editOpen = true;
  }

  closeEdit() {
    this.editOpen = false;
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.avatarFile = input.files[0];
      this.avatarPreview = URL.createObjectURL(this.avatarFile);
    }
  }

  saveEdit() {
    this.saving = true;
    this.saveError = '';

    // Save bio first, then avatar if one was picked, so either can succeed
    // independently and we always end with the freshest user object.
    this.userService.updateProfile({ bio: this.editBio }).subscribe({
      next: (res) => {
        this.user = res.user;
        if (this.avatarFile) {
          this.userService.uploadAvatar(this.avatarFile).subscribe({
            next: (avatarRes) => {
              this.user = avatarRes.user;
              this.saving = false;
              this.editOpen = false;
            },
            error: (err) => {
              this.saving = false;
              this.saveError = err.error?.message || 'Failed to upload image';
            },
          });
        } else {
          this.saving = false;
          this.editOpen = false;
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Failed to update profile';
      },
    });
  }

  remove(post: Post) {
    this.confirmDialog.open(
      'Delete Post',
      'Are you sure you want to permanently delete this post?',
      (confirmed: any) => {
        if (!confirmed) {
          return;
        }
        this.postService.deletePost(post._id).subscribe({
          next: () => {
            this.posts = this.posts.filter((p) => p._id !== post._id);
            this.toast.success(
              'Post Deleted',
              'Your post has been deleted successfully.',
            );
          },

          error: (err) => {
            this.toast.error(
              'Delete Failed',
              err.error?.message || 'Unable to delete post.',
            );
          },
        });
      },
      'Delete',
      'Cancel',
    );
  }
}
