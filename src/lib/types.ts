import { Timestamp } from "firebase/firestore";

// Corresponds to the 'users' collection in Firestore
export interface Designer {
  id: string; // The document ID from Firestore
  uid: string; // The user's UID from Firebase Auth
  name: string;
  email: string;
  photoURL?: string;
  coverPhotoURL?: string;
  specialization?: string;
  bio?: string;
  subscriberCount: number;
  followers: string[]; // Array of user UIDs
  phoneNumber?: string;
  telegramUrl?: string;
  createdAt: Timestamp;
  pushSubscriptions?: any[]; // For Web Push Notifications
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
    content?: string; 
    type: 'text' | 'audio' | 'video';
    audioUrl?: string;
    videoUrl?: string;
    createdAt: Timestamp;
    isRead: boolean;
}

// Corresponds to the 'notifications' collection
export interface Notification {
    id: string;
    userId: string; // User who receives the notification
    type: 'like' | 'follow' | 'message' | 'comment' | 'new_project';
    senderId: string; // User who triggered the notification
    senderName: string;
    senderPhotoURL?: string;
    isRead: boolean;
    projectId?: string; // For 'like', 'comment' and 'new_project' on a project
    projectName?: string;
    messageSnippet?: string; // For 'message' or 'comment'
    createdAt: Timestamp;
}

// Corresponds to the 'comments' subcollection
export interface Comment {
    id: string;
    projectId: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    createdAt: Timestamp;
}

// Corresponds to the 'typingStatus' collection
export interface TypingStatus {
    id: string; // Same as userId
    status: 'idle' | 'typing' | 'recording';
    recipientId: string; // The user they are in a chat with
    createdAt: Timestamp;
}


// Extending NextAuth types
import type { DefaultSession, User } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      photoURL?: string;
      specialization?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
