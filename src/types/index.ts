export type EnrollmentStatus = 'ENROLLED' | 'APPROVED' | 'FAILED' | 'LOCKED';
export type SubjectClassStatus = 'ACTIVE' | 'COMPLETED';

export interface GradeConfig {
  id: string;
  label: string;
  weight: number;
  order: number;
  grade: number | null;
}

export interface Enrollment {
  id: string;
  userId: string;
  subjectId: string;
  status: EnrollmentStatus;
  gradeConfigs?: GradeConfig[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  professor?: string;
  hours?: number;
  code?: string | null;
  classStatus?: SubjectClassStatus;
  classGroupId?: string | null;
  classGroup?: { id: string; name: string } | null;
  studentSubjects?: StudentSubject[];
  enrollments?: Enrollment[];
}

export interface StudentSubject {
  id: string;
  userId: string;
  subjectId: string;
  absences: number;
  av1: number | null;
  av2: number | null;
  av3: number | null;
  enrollmentStatus?: EnrollmentStatus;
}

export type EventType = 'class' | 'exam' | 'assignment' | 'other';
export type Scope = 'INDIVIDUAL' | 'CLASS';

export interface Event {
  id: string;
  subjectId?: string;
  title: string;
  date: string; // ISO string 
  type: EventType;
  completed: boolean;
  description?: string;
  scope?: Scope;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string; // markdown or plain text
  createdAt: string;
  updatedAt: string;
}
