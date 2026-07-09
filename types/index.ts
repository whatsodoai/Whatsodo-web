export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface BusinessMember {
  userId: string | { _id: string; name: string; email: string };
  role: 'admin' | 'agent';
  addedAt: string;
}

export interface CarouselButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  value?: string;
}

export interface CarouselCard {
  imageUrl: string;
  bodyText: string;
  buttons: CarouselButton[];
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  bodyPreview: string;
  variableCount: number;
  createdAt: string;
  type?: 'standard' | 'carousel';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  metaTemplateId?: string;
  cards?: CarouselCard[];
}

export interface Business {
  _id: string;
  businessName: string;
  industry: string;
  whatsappNumber: string;
  timezone: string;
  ownerId: string | { _id: string; name: string; email: string };
  members?: BusinessMember[];
  whatsappTemplates?: WhatsAppTemplate[];
  whatsappBusinessAccountId?: string;
  whatsappAppId?: string;
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
  assignedTo?: string | null;
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
  mediaType?: 'image' | 'video' | 'document';
  mediaUrl?: string;
  mediaCaption?: string;
  fileName?: string;
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
  slotDuration: number; // minutes: 30 | 45 | 60 | 90 | 120
}

export interface Campaign {
  _id: string;
  businessId: string;
  templateName: string;
  language: string;
  segment: {
    leadIds?: string[];
    status?: string;
    source?: string;
    intentTag?: string;
  };
  status: 'draft' | 'sending' | 'completed' | 'failed';
  stats: { total: number; sent: number; failed: number };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  _id: string;
  campaignId: string;
  leadId: Lead | string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt?: string;
}

export interface AiEmployee {
  _id: string;
  businessId: string;
  name: string;
  role: string;
  department: string;
  personality: string;
  language: string;
  avatar: string;
  responsibilities: string[];
  workingInstructions: string;
  escalationRules: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
}
