export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubTopic {
  id: string;
  name: string;
  topic_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Test {
  id: string;
  name: string;
  type: string;
  subject: string | null; // Can be subject name or subject UUID
  topics: string[] | string | null;
  sub_topics: string[] | string | null;
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: 'draft' | 'live' | null;
  questions?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  id?: string;
  type: 'mcq';
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 'option1' | 'option2' | 'option3' | 'option4';
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  test_id: string;
  subject?: string;
  topic?: string;
  sub_topic?: string;
  topic_id?: string;
  sub_topic_id?: string;
  media_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number | string;
  userId: string;
  name?: string;
  role?: string;
  subrole?: string;
  phone?: string;
  joiningDate?: string;
  endDate?: string;
  lastActive?: string;
  payment?: boolean;
}

export interface LoginResponse {
  success?: boolean;
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface GeneralResponse<T> {
  success?: boolean;
  status: string;
  message?: string;
  data: T;
}
