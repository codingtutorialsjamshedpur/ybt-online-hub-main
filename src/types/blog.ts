export interface BlogPost {
  id?: string;
  author: string;
  category: string;
  content: string;
  createdAt: any; // Firestore Timestamp
  date: string;
  image: string;
  likes: number;
  shares: number;
  status: 'Published' | 'Draft';
  tags: string[];
  title: string;
  updatedAt: any; // Firestore Timestamp
}