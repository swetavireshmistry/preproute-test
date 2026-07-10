import axios from 'axios';
import type { Subject, Topic, SubTopic, Test, Question, LoginResponse, GeneralResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://admin-moderator-backend-staging.up.railway.app/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication
  async login(userId: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', { userId, password });
    return response.data;
  },

  // Subjects
  async getSubjects(): Promise<GeneralResponse<Subject[]>> {
    const response = await apiClient.get('/subjects');
    return response.data;
  },

  // Topics
  async getTopicsBySubject(subjectId: string): Promise<GeneralResponse<Topic[]>> {
    const response = await apiClient.get(`/topics/subject/${subjectId}`);
    return response.data;
  },

  // Sub-topics
  async getSubTopicsByTopic(topicId: string): Promise<GeneralResponse<SubTopic[]>> {
    const response = await apiClient.get(`/sub-topics/topic/${topicId}`);
    return response.data;
  },

  async getSubTopicsByMultiTopics(topicIds: string[]): Promise<GeneralResponse<SubTopic[]>> {
    const response = await apiClient.post('/sub-topics/multi-topics', { topicIds });
    return response.data;
  },

  // Tests
  async getTests(): Promise<GeneralResponse<Test[]>> {
    const response = await apiClient.get('/tests');
    return response.data;
  },

  async getTestById(id: string): Promise<GeneralResponse<Test>> {
    const response = await apiClient.get(`/tests/${id}`);
    return response.data;
  },

  async createTest(testData: Partial<Test>): Promise<GeneralResponse<Test>> {
    const response = await apiClient.post('/tests', testData);
    return response.data;
  },

  async updateTest(id: string, testData: Partial<Test>): Promise<GeneralResponse<Test>> {
    const response = await apiClient.put(`/tests/${id}`, testData);
    return response.data;
  },

  async deleteTest(id: string): Promise<GeneralResponse<null>> {
    // If backend doesn't support DELETE tests, this will catch and we handle it gracefully.
    const response = await apiClient.delete(`/tests/${id}`);
    return response.data;
  },

  // Questions
  async bulkCreateQuestions(questions: Question[]): Promise<GeneralResponse<Question[]>> {
    const response = await apiClient.post('/questions/bulk', { questions });
    return response.data;
  },

  async fetchBulkQuestions(questionIds: string[]): Promise<GeneralResponse<Question[]>> {
    const response = await apiClient.post('/questions/fetchBulk', { question_ids: questionIds });
    return response.data;
  },

  async publishTest(id: string): Promise<GeneralResponse<Test>> {
    const response = await apiClient.put(`/tests/${id}`, { status: 'live' });
    return response.data;
  }
};
