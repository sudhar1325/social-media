import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../core/services/post.service';

interface PreviewFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  error?: string;
}

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
  selectedFiles: PreviewFile[] = [];
  loading = false;
  error = '';

  readonly MAX_IMAGE_MB = 5;
  readonly MAX_VIDEO_SEC = 30;

  constructor(private postService: PostService, private router: Router) {}

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (const file of Array.from(input.files)) {
      // skip duplicates
      const exists = this.selectedFiles.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (exists) continue;

      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      const type: 'image' | 'video' = isVideo ? 'video' : 'image';
      const previewUrl = URL.createObjectURL(file);
      let fileError: string | undefined;

      if (isImage) {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > this.MAX_IMAGE_MB) {
          fileError = `Image too large (${sizeMB.toFixed(1)} MB) — max ${this.MAX_IMAGE_MB} MB`;
        }
      }

      if (isVideo) {
        try {
          const duration = await this.getVideoDuration(previewUrl);
          if (duration > this.MAX_VIDEO_SEC) {
            fileError = `Video too long (${Math.round(duration)}s) — max ${this.MAX_VIDEO_SEC}s`;
          }
        } catch {
          // can't read duration — let server validate
        }
      }

      this.selectedFiles.push({ file, previewUrl, type, error: fileError });
    }

    input.value = '';
  }

  private getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error('Cannot read video'));
    });
  }

  removeFile(index: number) {
    URL.revokeObjectURL(this.selectedFiles[index].previewUrl);
    this.selectedFiles.splice(index, 1);
  }

  get hasErrors(): boolean {
    return this.selectedFiles.some((f) => !!f.error);
  }

  submit() {
    if (!this.description && this.selectedFiles.length === 0) {
      this.error = 'Add some text or attach media first.';
      return;
    }
    if (this.hasErrors) {
      this.error = 'Remove invalid files before submitting.';
      return;
    }

    this.error = '';
    this.loading = true;

    const formData = new FormData();
    formData.append('description', this.description);
    formData.append('category', this.category);
    this.selectedFiles.forEach((f) => formData.append('media', f.file));

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.loading = false;
        this.selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to submit post';
      },
    });
  }
}