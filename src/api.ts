import axios from 'axios';
import { HCP, Interaction, ScheduleItem } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth is now handled by Supabase in authSlice.ts

// HCP APIs
export const fetchHcps = async (): Promise<HCP[]> => {
  const { data } = await api.get('/hcps');
  return data;
};

export const createHcp = async (hcp: HCP): Promise<HCP> => {
  const { data } = await api.post('/hcps', hcp);
  return data;
};

// Interaction APIs
export const fetchInteractions = async (): Promise<Interaction[]> => {
  const { data } = await api.get('/interactions');
  return data;
};

export const createInteraction = async (interaction: Omit<Interaction, 'timestamp'>): Promise<Interaction> => {
  // Add a generated timestamp for the frontend just like before, but let backend handle it if needed.
  // The schema requires it right now.
  const dateToday = new Date();
  const formattedTimestamp = `${dateToday.getDate()} Oct, ${String(dateToday.getHours()).padStart(2, '0')}:${String(dateToday.getMinutes()).padStart(2, '0')}`;
  
  const { data } = await api.post('/interactions', {
    ...interaction,
    timestamp: formattedTimestamp
  });
  return data;
};

// Schedule APIs
export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  const { data } = await api.get('/schedule');
  return data;
};

export const createSchedule = async (item: ScheduleItem): Promise<ScheduleItem> => {
  const { data } = await api.post('/schedule', item);
  return data;
};

// FollowUp APIs
export interface FollowUp {
  id: string;
  hcp: string;
  reason: string;
  due: string;
  priority: string;
  completed: boolean;
}

export const fetchFollowups = async (): Promise<FollowUp[]> => {
  const { data } = await api.get('/followups');
  return data;
};

export const createFollowup = async (item: Omit<FollowUp, 'id' | 'completed'>): Promise<FollowUp> => {
  const { data } = await api.post('/followups', { ...item, id: `fu-${Date.now()}` });
  return data;
};

export default api;
