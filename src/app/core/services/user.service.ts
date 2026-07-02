import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, Post } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<{ success: boolean; user: User }>(this.base);
  }

  updateProfile(data: { bio?: string }) {
    return this.http.put<{ success: boolean; user: User }>(this.base, data);
  }

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.put<{ success: boolean; user: User }>(`${this.base}/avatar`, formData);
  }

  getUserProfile(id: string) {
    return this.http.get<{ success: boolean; user: User; posts: Post[] }>(
      `${environment.apiUrl}/users/${id}`
    );
  }
}