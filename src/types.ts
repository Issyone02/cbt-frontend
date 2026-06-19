// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the CBT frontend.
// Import from here instead of using `any` throughout the codebase.
// ─────────────────────────────────────────────────────────────────────────────

export interface Role {
  name: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  examAttempts?: number;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK' | 'THEORY';
  points: number;
  orderIndex: number;
  options: Option[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  passingScorePercent: number;
  negativeMarkingPercent: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  questions: Question[];
  _count?: { questions: number };
}

export interface ExamAttempt {
  id: string;
  studentId: string;
  examId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  startedAt: string;
  submittedAt?: string;
  autoSaveData?: string;
}

export interface Result {
  id: string;
  attemptId: string;
  totalPoints: number;
  obtainedPoints: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  exam?: Exam;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  answerText: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface ExamSession {
  attempt: ExamAttempt;
  questions: Question[];
  examDuration: number;
  startedAt: string;
  savedAnswers: Record<string, string>;
}

// Question form state used in CreateExam and ManageQuestions
export interface QuestionFormState {
  text: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK' | 'THEORY';
  points: number;
  options: OptionFormState[];
}

export interface OptionFormState {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}