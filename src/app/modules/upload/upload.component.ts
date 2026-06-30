import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../core/services/post.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  description = '';
  category = 'general';
  file: File | null = null;
  fileName = '';
  loading = false;
  error = '';

  constructor(private postService: PostService, private router: Router) {}

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0];
      this.fileName = this.file.name;
    }
  }

  submit() {
    if (!this.description && !this.file) {
      this.error = 'Add some text or attach media first.';
      return;
    }
    this.error = '';
    this.loading = true;

    const formData = new FormData();
    formData.append('description', this.description);
    formData.append('category', this.category);
    if (this.file) formData.append('media', this.file);

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to submit post';
      },
    });
  }
}
