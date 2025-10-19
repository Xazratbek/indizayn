import { Timestamp } from "firebase/firestore";

// Corresponds to the 'users' collection in Firestore
export interface Designer {
  id: string; // The user's UID from Firebase Auth
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
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
  imageUrl: string;
  tags: string[];
  tools: string[];
  viewCount: number;
  likeCount: number;
  likes: string[]; // Array of user UIDs who liked it
  description: string;
  createdAt: Timestamp;
}
