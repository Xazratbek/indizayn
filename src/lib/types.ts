
import { Timestamp } from "firebase/firestore";

// Corresponds to the 'users' collection in Firestore
export interface Designer {
  id: string; // The user's UID from Firebase Auth (now from next-auth token.sub)
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  coverPhotoURL?: string;
  specialization?: string;
  bio?: string;
  subscriberCount: number;
  followers: string[]; // Array of user UIDs
  createdAt: Timestamp;
}

// Corresponds to the 'projects' collection in Firestore
export interface Project {
  id: string; // Document ID from Firestore
  name: string;
  designerId: string; // UID of the designer who created it
  imageUrl: string; // The primary image for thumbnails
  imageUrls: string[]; // Array of all project image URLs
  tags: string[];
  tools: string[];
  viewCount: number;
  likeCount: number;
  likes: string[]; // Array of user UIDs who liked it
  description: string;
  createdAt: Timestamp;
}

// Corresponds to the 'messages' collection
export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Timestamp;
    isRead: boolean;
}

// Corresponds to the 'notifications' collection
export interface Notification {
    id: string;
    userId: string; // User who receives the notification
    type: 'like' | 'follow' | 'message';
    senderId: string; // User who triggered the notification
    senderName: string;
    senderPhotoURL?: string;
    isRead: boolean;
    projectId?: string; // For 'like' and 'comment' on a project
    projectName?: string;
    messageSnippet?: string; // For 'message'
    createdAt: Timestamp;
}


// Extending NextAuth types
import type { DefaultSession, User } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
