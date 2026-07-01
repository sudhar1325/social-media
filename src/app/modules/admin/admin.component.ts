import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { Post, User } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  stats: any = null;
  pending: Post[] = [];
  pendingUsers: User[] = [];
  users: User[] = [];
  reports: any[] = [];
  tab: 'pendingUsers' | 'pending' | 'reports' | 'users' = 'users';
  fileBase = environment.fileBaseUrl;

  showEditModal = false;
  editForm: {
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    accountStatus: 'pending' | 'active' | 'suspended';
  } = {
    _id: '',
    username: '',
    email: '',
    role: 'user',
    accountStatus: 'pending',
  };
  saving = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.refreshStats();
    this.loadPendingUsers();
    this.loadPending();
    this.loadUsers();
    this.loadReports();
  }

  refreshStats() {
    this.adminService.getStats().subscribe((res) => (this.stats = res.stats));
  }

  loadPendingUsers() {
    this.adminService
      .getPendingUsers()
      .subscribe((res) => (this.pendingUsers = res.users));
  }

  loadPending() {
    this.adminService
      .getPendingPosts()
      .subscribe((res) => (this.pending = res.posts));
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
    const reason =
      prompt('Reason for rejection?') || 'Did not meet community guidelines';
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

  loadReports() {
    this.adminService.getReports().subscribe((res) => {
      this.reports = res.reports;
    });
  }

  resolveReport(report: any) {
    this.adminService.resolveReport(report._id, 'resolved').subscribe({
      next: (res) => {
        console.log(res);

        this.loadReports();
        this.refreshStats();
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  dismissReport(report: any) {
    this.adminService.resolveReport(report._id, 'dismissed').subscribe({
      next: (res) => {
        console.log(res);

        this.loadReports();
        this.refreshStats();
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  editUser(u: User) {
    this.editForm = {
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      accountStatus: u.accountStatus,
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.saving = false;
  }

  saveEdit() {
    if (!this.editForm.username.trim() || !this.editForm.email.trim()) {
      alert('Username and email cannot be empty.');
      return;
    }

    this.saving = true;
    const { _id, ...payload } = this.editForm;

    this.adminService.updateUser(_id, payload).subscribe({
      next: (res: { success: boolean; user: User }) => {
        const updated = res.user;
        const inUsers = this.users.find((x) => x._id === _id);
        if (inUsers) Object.assign(inUsers, updated);

        const inPending = this.pendingUsers.find((x) => x._id === _id);
        if (inPending) Object.assign(inPending, updated);

        this.refreshStats();
        this.closeEditModal();
      },
      error: (err: any) => {
        console.error('Update user error:', err);
        alert('Failed to update user. Check console for details.');
        this.saving = false;
      },
    });
  }

  deleteUser(u: User) {
    if (u.role === 'admin') {
      alert('Cannot delete an admin user!');
      return;
    }

    const confirmed = confirm(`Are you sure you want to permanently delete "${u.username}"?`);
    if (!confirmed) return;

    this.adminService.deleteUser(u._id).subscribe({
      next: () => {
        this.users = this.users.filter((x) => x._id !== u._id);
        this.pendingUsers = this.pendingUsers.filter((x) => x._id !== u._id);
        this.refreshStats();
      },
      error: (err: any) => {
        console.error('Delete API error:', err);
        alert('Failed to delete user. Check console for details.');
      },
    });
  }

  showAddModal = false;
addForm: { username: string; email: string; password: string; role: 'user' | 'admin' } = {
  username: '',
  email: '',
  password: '',
  role: 'user',
};
adding = false;

openAddModal() {
  this.addForm = { username: '', email: '', password: '', role: 'user' };
  this.showAddModal = true;
}

closeAddModal() {
  this.showAddModal = false;
  this.adding = false;
}

saveAddUser() {
  if (!this.addForm.username.trim() || !this.addForm.email.trim() || !this.addForm.password.trim()) {
    alert('Username, email and password are required.');
    return;
  }
  if (this.addForm.password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  this.adding = true;
  this.adminService.createUser(this.addForm).subscribe({
    next: (res: { success: boolean; user: User }) => {
      this.users.unshift(res.user);
      this.refreshStats();
      this.closeAddModal();
    },
    error: (err: any) => {
      console.error('Create user error:', err);
      alert(err?.error?.message || 'Failed to create user. Check console for details.');
      this.adding = false;
    },
  });
 }



}