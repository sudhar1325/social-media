export interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  profileImage?: string;
  bio?: string;
  accountStatus: 'pending' | 'active' | 'suspended';
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  createdAt?: string;
}

export interface Post {
  _id: string;
  userId: User | string;
  description: string;
  mediaType: 'image' | 'video' | 'mixed' | 'text';
  mediaURL: string;
  mediaFiles: MediaFile[];
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: User | string;
  comment: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: { id: string; username: string; email: string; accountStatus: string };
}