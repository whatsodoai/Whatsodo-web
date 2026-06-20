export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  _id: string;
  businessName: string;
  industry: string;
  whatsappNumber: string;
  timezone: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Appointment Booked'
  | 'Won'
  | 'Lost';

export interface Lead {
  _id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  intentTag?: 'hot' | 'warm' | 'cold';
  intentScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  businessId: string;
  leadId: Lead | string;
  date: string;
  time: string;
  status: 'Booked' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  businessId: string;
  phone: string;
  direction: 'incoming' | 'outgoing';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  phone: string;
  leadName?: string;
  lastMessage: string;
  lastMessageTime: string;
  direction: 'incoming' | 'outgoing';
  unread?: boolean;
}

export interface KnowledgeBase {
  _id: string;
  businessId: string;
  companyName: string;
  companyDescription: string;
  services: string[];
  faqs: { question: string; answer: string }[];
  salesInstructions: string;
  appointmentInstructions: string;
  tone: string;
  contactEmail: string;
  contactPhone: string;
  leadQualificationQuestions: string[];
  callToActions: string[];
  offers: string[];
  objectionHandling: { objection: string; response: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  qualified: number;
  won: number;
  lost: number;
  totalAppointments: number;
  appointmentBooked?: number;
}

export interface Availability {
  _id: string;
  businessId: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
}
