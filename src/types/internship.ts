export interface Internship {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  duration_days: number;
  certificate_fee_paise: number;
  pass_mark_percent: number;
  is_active: boolean;
}

export interface ModuleRow {
  id: string;
  internship_id: string;
  order_index: number;
  title: string;
  description: string;
  content: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  internship_id: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "certificate_scheduled"
    | "certificate_issued";
  modules_completed: boolean;
  quiz_passed: boolean;
  quiz_score: number | null;
  quiz_percent: number | null;
  payment_verified: boolean;
  internships?: Internship;
}

export interface ModuleProgress {
  id: string;
  enrollment_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface QuizQuestionPublic {
  id: string;
  order_index: number;
  question: string;
  options: string[];
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  certificate_number: string;
  verification_code: string;
  issue_date: string;
  pdf_path: string | null;
  status: "issued" | "revoked";
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  college: string;
  role: "student" | "admin";
}
