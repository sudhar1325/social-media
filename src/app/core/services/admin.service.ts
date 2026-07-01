import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Post, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<{ success: boolean; stats: any }>(
      `${this.base}/dashboard`,
    );
  }

  getPendingPosts() {
    return this.http.get<{ success: boolean; posts: Post[] }>(
      `${this.base}/posts/pending`,
    );
  }

  approvePost(id: string) {
    return this.http.put<{ success: boolean; post: Post }>(
      `${this.base}/posts/${id}/approve`,
      {},
    );
  }

  rejectPost(id: string, reason: string) {
    return this.http.put<{ success: boolean; post: Post }>(
      `${this.base}/posts/${id}/reject`,
      {
        reason,
      },
    );
  }

  getUsers() {
    return this.http.get<{ success: boolean; users: User[] }>(
      `${this.base}/users`,
    );
  }

  getPendingUsers() {
    return this.http.get<{ success: boolean; users: User[] }>(
      `${this.base}/users/pending`,
    );
  }

  approveUser(id: string) {
    return this.http.put<{ success: boolean; user: User }>(
      `${this.base}/users/${id}/approve`,
      {},
    );
  }

  setUserStatus(id: string, status: 'active' | 'suspended') {
    return this.http.put<{ success: boolean; user: User }>(
      `${this.base}/users/${id}/status`,
      {
        status,
      },
    );
  }

  getReports() {
    return this.http.get<{ success: boolean; reports: any[] }>(
      `${this.base}/reports`,
    );
  }

  resolveReport(id: string, status: 'resolved' | 'dismissed') {
    return this.http.put(`${this.base}/reports/${id}`, {
      status,
    });
  }
  // admin.service.ts — fix these two methods

updateUser(id: string, data: Partial<User>) {
  return this.http.patch<{ success: boolean; user: User }>(`${this.base}/users/${id}`, data);
}

deleteUser(id: string) {
  return this.http.delete<{ success: boolean; message: string }>(`${this.base}/users/${id}`);
}

createUser(data: { username: string; email: string; password: string; role: 'user' | 'admin' }) {
  return this.http.post<{ success: boolean; user: User }>(`${this.base}/users`, data);
}
  
}