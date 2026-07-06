import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Post, Comment } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PostService {
  private base = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

getFeed(page = 1, limit = 10, search = '') {
  return this.http.get<any>(
    `${environment.apiUrl}/posts/feed?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );
}

  getMyPosts() {
    return this.http.get<{ success: boolean; posts: Post[] }>(
      `${this.base}/mine`,
    );
  }

  getPost(id: string) {
    return this.http.get<{ success: boolean; post: Post }>(
      `${this.base}/${id}`,
    );
  }

  searchPosts(text: string, page = 1) {
    return this.http.get<any>(`${this.base}/posts/search`, {
      params: { q: text, page },
    });
  }

  createPost(formData: FormData) {
    return this.http.post<{ success: boolean; post: Post }>(
      this.base,
      formData,
    );
  }

  deletePost(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.base}/${id}`);
  }

  like(id: string) {
    return this.http.post<{ success: boolean; likeCount: number }>(
      `${this.base}/${id}/like`,
      {},
    );
  }

  unlike(id: string) {
    return this.http.delete<{ success: boolean; likeCount: number }>(
      `${this.base}/${id}/like`,
    );
  }

  getComments(id: string) {
    return this.http.get<{ success: boolean; comments: Comment[] }>(
      `${this.base}/${id}/comments`,
    );
  }

  addComment(id: string, comment: string) {
    return this.http.post<{ success: boolean; comment: Comment }>(
      `${this.base}/${id}/comments`,
      {
        comment,
      },
    );
  }

  deleteComment(commentId: string) {
    return this.http.delete(`${this.base}/posts/comments/${commentId}`);
  }

  reportPost(id: string, reason: string) {
    return this.http.post<{ success: boolean }>(`${this.base}/${id}/report`, {
      reason,
    });
  }
}
