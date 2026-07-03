import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { ToastService } from '../../core/services/toast.service';

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

  dragging = false;

  readonly MAX_IMAGE_MB = 5;
  readonly MAX_VIDEO_SEC = 30;

  constructor(
    private postService: PostService,
    private router: Router,
    private toast: ToastService,
  ) {}

  // ===============================
  // File Input
  // ===============================
  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    await this.handleFiles(input.files);

    input.value = '';
  }

  // ===============================
  // Drag & Drop
  // ===============================
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();

    this.dragging = false;

    if (!event.dataTransfer?.files.length) return;

    await this.handleFiles(event.dataTransfer.files);
  }

  // ===============================
  // Shared File Processing
  // ===============================
  async handleFiles(fileList: FileList) {
    for (const file of Array.from(fileList)) {
      // Skip duplicates
      const exists = this.selectedFiles.some(
        (f) => f.file.name === file.name && f.file.size === file.size,
      );

      if (exists) continue;

      const isImage = file.type.startsWith('image');
      const isVideo = file.type.startsWith('video');

      if (!isImage && !isVideo) continue;

      const previewUrl = URL.createObjectURL(file);

      const type: 'image' | 'video' = isVideo ? 'video' : 'image';

      let fileError: string | undefined;

      // Image validation
      if (isImage) {
        const sizeMB = file.size / (1024 * 1024);

        if (sizeMB > this.MAX_IMAGE_MB) {
          fileError = `Image too large (${sizeMB.toFixed(
            1,
          )} MB). Maximum ${this.MAX_IMAGE_MB} MB`;
        }
      }

      // Video validation
      if (isVideo) {
        try {
          const duration = await this.getVideoDuration(previewUrl);

          if (duration > this.MAX_VIDEO_SEC) {
            fileError = `Video too long (${Math.round(
              duration,
            )} sec). Maximum ${this.MAX_VIDEO_SEC} sec`;
          }
        } catch {}
      }

      this.selectedFiles.push({
        file,
        previewUrl,
        type,
        error: fileError,
      });
    }
  }

  // ===============================
  // Read Video Duration
  // ===============================
  private getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');

      video.preload = 'metadata';
      video.src = url;

      video.onloadedmetadata = () => {
        resolve(video.duration);
      };

      video.onerror = () => {
        reject();
      };
    });
  }

  // ===============================
  // Remove File
  // ===============================
  removeFile(index: number) {
    URL.revokeObjectURL(this.selectedFiles[index].previewUrl);

    this.selectedFiles.splice(index, 1);
  }

  // ===============================
  // Validation
  // ===============================
  get hasErrors(): boolean {
    return this.selectedFiles.some((f) => !!f.error);
  }

  // ===============================
  // Submit
  // ===============================
  submit() {
    if (!this.description.trim() && this.selectedFiles.length === 0) {
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

    this.selectedFiles.forEach((file) => {
      formData.append('media', file.file);
    });

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.loading = false;

        // ✅ Show success toast HERE
        this.toast.success(
          'Post Uploaded',
          'Your post has been sent for review.',
        );

        this.selectedFiles.forEach((file) =>
          URL.revokeObjectURL(file.previewUrl),
        );

        this.selectedFiles = [];
        this.description = '';
        this.category = 'general';

        this.router.navigate(['/profile']);
      },

      error: (err) => {
        this.loading = false;

        this.toast.error(
          'Upload Failed',
          err.error?.message || 'Failed to submit post.',
        );

        this.error = err.error?.message || 'Failed to submit post';
      },
    });
  }
}
