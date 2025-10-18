export interface Project {
  id: string;
  name: string;
  designerId: string;
  imageId: string;
  tags: string[];
  views: number;
  likes: number;
  description: string;
  tools: string[];
  createdAt: string;
}

export interface Designer {
  id: string;
  name: string;
  avatarId: string;
  specialization: string;
  subscribers: number;
}
