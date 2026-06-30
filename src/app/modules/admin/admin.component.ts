import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { Post, User } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  stats: any = null;
  pending: Post[] = [];
  pendingUsers: User[] = [];
  users: User[] = [];
  tab: 'pendingUsers' | 'pending' | 'users' = 'pendingUsers';
  fileBase = environment.fileBaseUrl;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.refreshStats();
    this.loadPendingUsers();
    this.loadPending();
    this.loadUsers();
  }

  refreshStats() {
    this.adminService.getStats().subscribe((res) => (this.stats = res.stats));
  }

  loadPendingUsers() {
    this.adminService.getPendingUsers().subscribe((res) => (this.pendingUsers = res.users));
  }

  loadPending() {
    this.adminService.getPendingPosts().subscribe((res) => (this.pending = res.posts));
  }

  loadUsers() {
    this.adminService.getUsers().subscribe((res) => (this.users = res.users));
  }

  authorName(post: Post): string {
    const u = post.userId as User;
    return typeof u === 'object' ? u.username : 'unknown';
  }

  approve(post: Post) {
    this.adminService.approvePost(post._id).subscribe(() => {
      this.pending = this.pending.filter((p) => p._id !== post._id);
      this.refreshStats();
    });
  }

  reject(post: Post) {
    const reason = prompt('Reason for rejection?') || 'Did not meet community guidelines';
    this.adminService.rejectPost(post._id, reason).subscribe(() => {
      this.pending = this.pending.filter((p) => p._id !== post._id);
      this.refreshStats();
    });
  }

  approveUser(u: User) {
    this.adminService.approveUser(u._id).subscribe((res) => {
      this.pendingUsers = this.pendingUsers.filter((p) => p._id !== u._id);
      const inAllUsers = this.users.find((x) => x._id === u._id);
      if (inAllUsers) inAllUsers.accountStatus = res.user.accountStatus;
      this.refreshStats();
    });
  }

  suspend(u: User) {
    this.adminService.setUserStatus(u._id, 'suspended').subscribe((res) => {
      u.accountStatus = res.user.accountStatus;
    });
  }

  activate(u: User) {
    this.adminService.setUserStatus(u._id, 'active').subscribe((res) => {
      u.accountStatus = res.user.accountStatus;
    });
  }
}
