
export type UserRole = 'student' | 'teacher' | 'editor';

export enum ExerciseType {
  MULTIPLE_CHOICE = 'mcq',
  FREE_TEXT = 'text',
  DRAWING = 'drawing',
  HYPERLINK = 'link'
}

export interface Class {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  password?: string;
  role: UserRole;
  classId?: string;
  isApproved: boolean;
  profilePicture?: string; // Base64 da imagem de perfil
  viewedAnnouncements?: string[];
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  message: string;
  date: string;
  authorName: string;
}

export interface Comment {
  id: string;
  magazineId: string;
  userId: string;
  userName: string;
  userAvatar?: string; // Foto do usuário no momento do comentário
  text: string;
  timestamp: number;
}

export interface Attendance {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  date: string;
  isPresent: boolean;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  url?: string;
  x: number;
  y: number;
}

export interface Page {
  id: string;
  imageUrl: string;
  pageNumber: number;
  exercises: Exercise[];
}

export interface Magazine {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  pages: Page[];
  pdfUrl?: string;
  classId: string;
}

export interface UserResponse {
  exerciseId: string;
  answer: any;
  timestamp: number;
}
