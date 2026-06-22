const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('whatsodo_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  // All backend responses wrap payload in { success, data } — unwrap it
  return (json.data !== undefined ? json.data : json) as T;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json as { success: boolean; token: string; user: import('@/types').User };
  },

  register: async (name: string, email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json as { success: boolean; token: string; user: import('@/types').User };
  },

  getProfile: () =>
    request<{ success: boolean; user: import('@/types').User }>('/auth/profile'),

  // ── Business ──────────────────────────────────────────────────────────────
  createBusiness: (data: {
    businessName: string;
    industry: string;
    whatsappNumber: string;
    timezone?: string;
  }) => request<import('@/types').Business>('/business', { method: 'POST', body: JSON.stringify(data) }),

  updateBusiness: (id: string, data: {
    businessName?: string;
    industry?: string;
    whatsappNumber?: string;
    timezone?: string;
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappVerifyToken?: string;
    whatsappBusinessAccountId?: string;
    whatsappAppId?: string;
  }) => request<import('@/types').Business>(`/business/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getBusinesses: () => request<import('@/types').Business[]>('/business'),

  getWhatsAppDefaults: (businessId: string) =>
    request<{ webhookUrl: string; verifyToken: string; phoneNumberId: string; hasAccessToken: boolean }>(
      `/business/whatsapp-defaults?businessId=${businessId}`
    ),

  connectWhatsAppEmbedded: (
    businessId: string,
    data: { code: string; wabaId: string; phoneNumberId: string }
  ) =>
    request<import('@/types').Business>(`/business/${businessId}/whatsapp/connect`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBusiness: (id: string) => request<import('@/types').Business>(`/business/${id}`),

  addBusinessMember: (businessId: string, email: string, role: 'admin' | 'agent') =>
    request<{ userId: string; name: string; email: string; role: string }>(
      `/business/${businessId}/members`,
      { method: 'POST', body: JSON.stringify({ email, role }) }
    ),

  removeBusinessMember: (businessId: string, userId: string) =>
    request<import('@/types').Business>(`/business/${businessId}/members/${userId}`, {
      method: 'DELETE',
    }),

  addTemplate: (businessId: string, data: { name: string; language: string; bodyPreview?: string; variableCount?: number }) =>
    request<import('@/types').WhatsAppTemplate[]>(`/business/${businessId}/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeTemplate: (businessId: string, templateName: string) =>
    request<import('@/types').WhatsAppTemplate[]>(
      `/business/${businessId}/templates/${encodeURIComponent(templateName)}`,
      { method: 'DELETE' }
    ),

  addCarouselTemplate: (businessId: string, data: {
    name: string;
    language: string;
    bodyText: string;
    cards: import('@/types').CarouselCard[];
  }) =>
    request<import('@/types').WhatsAppTemplate[]>(`/business/${businessId}/templates/carousel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Campaigns ─────────────────────────────────────────────────────────────
  createCampaign: (data: {
    businessId: string;
    templateName: string;
    language: string;
    leadIds?: string[];
    filter?: { status?: string; source?: string; intentTag?: string };
    variables?: string[];
  }) => request<import('@/types').Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  getCampaigns: (businessId: string) =>
    request<import('@/types').Campaign[]>(`/campaigns/${businessId}`),

  getCampaign: (businessId: string, campaignId: string) =>
    request<{ campaign: import('@/types').Campaign; recipients: import('@/types').CampaignRecipient[] }>(
      `/campaigns/${businessId}/${campaignId}`
    ),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardSummary: (businessId: string) =>
    request<import('@/types').DashboardSummary>(`/dashboard/summary/${businessId}`),

  // ── Leads ─────────────────────────────────────────────────────────────────
  getLeads: (businessId: string) =>
    request<import('@/types').Lead[]>(`/leads/${businessId}`),

  createLead: (data: Partial<import('@/types').Lead>) =>
    request<import('@/types').Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),

  updateLeadStatus: (leadId: string, status: import('@/types').LeadStatus) =>
    request<import('@/types').Lead>(`/leads/${leadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateLead: (id: string, data: Partial<import('@/types').Lead>) =>
    request<import('@/types').Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }),

  assignLead: (leadId: string, userId: string | null) =>
    request<import('@/types').Lead>(`/leads/${leadId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }),

  // ── Inbox ─────────────────────────────────────────────────────────────────
  getInbox: (businessId: string) =>
    request<import('@/types').InboxItem[]>(`/inbox/${businessId}`),

  // ── Messages ──────────────────────────────────────────────────────────────
  getMessages: (businessId: string, phone: string) =>
    request<import('@/types').Message[]>(`/messages/${businessId}/${phone}`),

  sendMessage: (businessId: string, phone: string, message: string) =>
    request<{ success: boolean }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ businessId, phone, message }),
    }),

  sendMediaMessage: (businessId: string, phone: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('businessId', businessId);
    formData.append('phone', phone);
    if (caption) formData.append('caption', caption);
    formData.append('file', file);
    return requestFormData<import('@/types').Message>('/messages/send-media', formData);
  },

  // ── Uploads ───────────────────────────────────────────────────────────────
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestFormData<{ url: string }>('/uploads', formData);
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  getAppointments: (businessId: string) =>
    request<import('@/types').Appointment[]>(`/appointments/${businessId}`),

  createAppointment: (data: {
    businessId: string;
    leadId: string;
    date: string;
    time: string;
    notes?: string;
  }) =>
    request<import('@/types').Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAppointmentStatus: (id: string, status: 'Booked' | 'Completed' | 'Cancelled', notes?: string) =>
    request<import('@/types').Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(notes !== undefined && { notes }) }),
    }),

  // ── Slots ─────────────────────────────────────────────────────────────────
  getSlots: async (businessId: string, date: string): Promise<string[]> => {
    const res = await request<{ success: boolean; slots: string[] }>(`/slots/${businessId}/${date}`);
    return res.slots ?? [];
  },

  // ── Knowledge Base ────────────────────────────────────────────────────────
  getKnowledgeBase: (businessId: string) =>
    request<import('@/types').KnowledgeBase>(`/knowledge-base/${businessId}`),

  createKnowledgeBase: (data: Partial<import('@/types').KnowledgeBase>) =>
    request<import('@/types').KnowledgeBase>('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── AI Chat ───────────────────────────────────────────────────────────────
  aiChat: async (businessId: string, message: string): Promise<string> => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ businessId, message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'AI chat failed');
    return json.reply as string;
  },

  // ── Availability ──────────────────────────────────────────────────────────
  getAvailability: (businessId: string) =>
    request<import('@/types').Availability[]>(`/availability/${businessId}`),

  createAvailability: (data: {
    businessId: string;
    day: string;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }) => request<{ success: boolean }>('/availability', { method: 'POST', body: JSON.stringify(data) }),

  // ── Test WhatsApp ─────────────────────────────────────────────────────────
  sendTestWhatsApp: (phone: string, message: string) =>
    request<{ success: boolean }>('/test-whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    }),
};
