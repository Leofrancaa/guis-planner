export interface Subject {
  id: string;
  name: string;
  color: string;
  professor?: string;
  hours?: number;
  studentSubjects?: {
    absences: number;
    av1: number | null;
    av2: number | null;
    av3: number | null;
  }[];
}

export type EventType = 'class' | 'exam' | 'assignment' | 'other';

export interface Event {
  id: string;
  subjectId?: string;
  title: string;
  date: string; // ISO string 
  type: EventType;
  completed: boolean;
  description?: string;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string; // markdown or plain text
  createdAt: string;
  updatedAt: string;
}
