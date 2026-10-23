// SeatSync API Client

const BASE_URL = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('seatsync_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('seatsync_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('seatsync_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    error.dbmsRule = data.dbmsRule;
    error.detail = data.detail;
    throw error;
  }

  return data;
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null') {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // System Health
  getHealth: () => request<any>('/health'),

  // Auth
  register: (body: { name: string; email: string; password: string; role?: string }) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  demoLogin: (email?: string) =>
    request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ email }) }),

  getMe: () => request<any>('/auth/me'),

  // Module A: Resources & Reservations
  getResources: (params?: { type?: string; minCapacity?: number }) =>
    request<any>(`/resources${buildQuery(params)}`),

  getResourceSchedule: (resourceId: number | string, date?: string) =>
    request<any>(`/resources/${resourceId}/schedule${date ? `?date=${date}` : ''}`),

  createReservation: (body: { resourceId: number; startTime: string; endTime: string; purpose?: string }) =>
    request<any>('/resources/reserve', { method: 'POST', body: JSON.stringify(body) }),

  cancelReservation: (reservationId: number | string) =>
    request<any>(`/resources/reservations/${reservationId}`, { method: 'DELETE' }),

  getMyReservations: () => request<any>('/resources/my/reservations'),

  // Module B: Peer Learning Listings & Skills
  getSkills: () => request<any>('/listings/skills'),

  getListings: (params?: any) =>
    request<any>(`/listings${buildQuery(params)}`),

  getListingById: (id: number | string) => request<any>(`/listings/${id}`),

  createListing: (body: {
    skillId: number;
    title: string;
    description: string;
    teachingFormat: string;
    difficulty: string;
    maxParticipants: number;
  }) => request<any>('/listings', { method: 'POST', body: JSON.stringify(body) }),

  // Peer Learning Requests
  submitRequest: (body: { listingId: number; message: string }) =>
    request<any>('/requests', { method: 'POST', body: JSON.stringify(body) }),

  getUserRequests: (type: 'all' | 'incoming' | 'outgoing' = 'all') =>
    request<any>(`/requests/my?type=${type}`),

  respondToRequest: (requestId: number | string, action: 'accepted' | 'rejected') =>
    request<any>(`/requests/${requestId}/respond`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  // Learning Sessions
  getSessions: (params?: any) =>
    request<any>(`/sessions${buildQuery(params)}`),

  getSessionParticipants: (sessionId: number | string) =>
    request<any>(`/sessions/${sessionId}/participants`),

  scheduleSession: (body: {
    listingId: number;
    startTime: string;
    endTime: string;
    resourceId?: number | null;
  }) => request<any>('/sessions/schedule', { method: 'POST', body: JSON.stringify(body) }),

  enrollLearner: (sessionId: number | string, requestId: number | string) =>
    request<any>(`/sessions/${sessionId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }),

  cancelSession: (sessionId: number | string) =>
    request<any>(`/sessions/${sessionId}`, { method: 'DELETE' }),

  // Evaluation Reports & Analytics
  getPopularSkills: () => request<any>('/reports/skills'),
  getUpcomingSessionsReport: () => request<any>('/reports/upcoming-sessions'),
  getLeaderboard: () => request<any>('/reports/leaderboard'),
  getResourceDemand: () => request<any>('/reports/resource-demand'),
  getTeacherPendingRequests: (teacherId?: number) =>
    request<any>(`/reports/pending-requests${teacherId ? `?teacherId=${teacherId}` : ''}`),
  getAuditLogs: (params?: { entityType?: string; limit?: number }) =>
    request<any>(`/reports/audit-logs${buildQuery(params)}`),
  getExplainAnalyze: () => request<any>('/reports/explain-analyze'),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getMaintenanceList: () => request<any>('/admin/maintenance'),
  scheduleMaintenance: (body: {
    resourceId: number;
    startTime: string;
    endTime: string;
    reason: string;
  }) => request<any>('/admin/maintenance', { method: 'POST', body: JSON.stringify(body) }),
  createResource: (body: {
    name: string;
    location: string;
    capacity: number;
    resourceType: string;
  }) => request<any>('/admin/resources', { method: 'POST', body: JSON.stringify(body) }),
};
