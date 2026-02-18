
export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED'
}

export interface ExamMark {
  subject: string;
  marks: number;
  total: number;
}

export interface Student {
  id: string;
  name: string;
  dob: string; // Date of Birth
  guardianName: string;
  guardianPhone: string;
  studentPhone: string;
  address: string;
  studentClass: string; // "Class 3" through "Class 12"
  admissionDate: string;
  status: StudentStatus;
  paidMonths: string[]; // e.g., ["2023-10", "2023-11"]
  attendance: string[]; // dates e.g., ["2023-10-25"] (Present)
  absences: string[];   // dates e.g., ["2023-10-26"] (Absent)
  examMarks: ExamMark[];
  syllabusProgress: number; // 0-100
  monthlyFee: number; // The specific fee amount for this student
  badges?: string[]; // Achievement badges like "Star Student"
  profileIcon?: string; // Identifier for selected profile icon
}

export interface Schedule {
  id: string;
  title: string;
  time: string;
  type: 'training' | 'admin';
  completed: boolean;
  date: string;
}

export interface SyllabusTopic {
  id: string;
  title: string;
  completed: boolean;
  targetClass: string;
}

export interface AuditLogEntry {
  id: string;
  event: string;
  timestamp: string;
}

export interface AppState {
  isLoggedIn: boolean;
  students: Student[];
  schedules: Schedule[];
  syllabusTopics: SyllabusTopic[];
  auditLogs: AuditLogEntry[];
}
