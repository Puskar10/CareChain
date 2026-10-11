import {
  User,
  Patient,
  HealthEvent,
  Medication,
  MedicalReport,
  VitalRecord,
  AuditLogItem,
  HandoverSummary,
  DemoAccount,
  EventType,
  MedicationScheduleItem,
  AIOverviewData,
  CarePlanItem,
  ClinicalOrder
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'carechain_jwt_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: json.error || `HTTP error ${response.status}: ${response.statusText}`
        };
      }

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network request failed'
      };
    }
  }

  // --- Health ---
  async checkHealth(): Promise<{ online: boolean; records?: any }> {
    try {
      const res = await this.request<any>('/health', { method: 'GET' });
      return { online: res.status === 'online', records: res.records };
    } catch {
      return { online: false };
    }
  }

  // --- Auth ---
  auth = {
    getDemoAccounts: async (): Promise<DemoAccount[]> => {
      const res = await this.request<any>('/auth/demo-accounts');
      return res.accounts || [];
    },

    login: async (email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
      const res = await this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success && res.token) {
        this.setToken(res.token);
        return { success: true, user: res.user, token: res.token };
      }
      return { success: false, error: res.error || 'Login failed' };
    },

    register: async (userData: {
      email: string;
      password: string;
      fullName: string;
      role: string;
      phone?: string;
      title?: string;
    }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
      const res = await this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (res.success && res.token) {
        this.setToken(res.token);
        return { success: true, user: res.user, token: res.token };
      }
      return { success: false, error: res.error || 'Registration failed' };
    },

    me: async (): Promise<{ success: boolean; user?: User; error?: string }> => {
      const token = this.getToken();
      if (!token) return { success: false, error: 'No token' };

      const res = await this.request<{ user: User }>('/auth/me', { method: 'GET' });
      return { success: res.success, user: res.user, error: res.error };
    },

    logout: async (): Promise<void> => {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } finally {
        this.setToken(null);
      }
    },

    oauthSync: async (payload: {
      email: string;
      fullName?: string;
      avatar?: string;
      requestedRole?: string;
      title?: string;
      supabaseUid?: string;
    }): Promise<{ success: boolean; user?: User; token?: string; error?: string; isNewUser?: boolean; message?: string }> => {
      const res = await this.request<{ user: User; token: string; isNewUser?: boolean; message?: string }>('/auth/oauth-sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.token && res.user) {
        this.setToken(res.token);
        return { success: true, user: res.user, token: res.token, isNewUser: res.isNewUser, message: res.message };
      }
      return { success: false, error: res.error || 'OAuth synchronization failed' };
    }
  };

  // --- Patients ---
  patients = {
    getAll: async (): Promise<Patient[]> => {
      const res = await this.request<Patient[]>('/patients');
      return res.data || [];
    },

    getById: async (id: string): Promise<Patient | null> => {
      const res = await this.request<Patient>(`/patients/${id}`);
      return res.data || null;
    },

    create: async (patient: Partial<Patient>): Promise<Patient | null> => {
      const res = await this.request<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(patient)
      });
      return res.data || null;
    },

    update: async (id: string, updates: Partial<Patient>): Promise<Patient | null> => {
      const res = await this.request<Patient>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return res.data || null;
    },

    getCarePlans: async (patientId: string): Promise<CarePlanItem[]> => {
      const res = await this.request<CarePlanItem[]>(`/patients/${patientId}/care-plans`);
      return res.data || [];
    },

    createCarePlan: async (patientId: string, plan: Partial<CarePlanItem>): Promise<CarePlanItem | null> => {
      const res = await this.request<CarePlanItem>(`/patients/${patientId}/care-plans`, {
        method: 'POST',
        body: JSON.stringify(plan)
      });
      return res.data || null;
    },

    getClinicalOrders: async (patientId: string): Promise<ClinicalOrder[]> => {
      const res = await this.request<ClinicalOrder[]>(`/patients/${patientId}/orders`);
      return res.data || [];
    },

    createClinicalOrder: async (patientId: string, order: Partial<ClinicalOrder>): Promise<ClinicalOrder | null> => {
      const res = await this.request<ClinicalOrder>(`/patients/${patientId}/orders`, {
        method: 'POST',
        body: JSON.stringify(order)
      });
      return res.data || null;
    }
  };

  // --- Health Events ---
  events = {
    getAll: async (patientId?: string, type?: EventType | 'all', time?: string): Promise<HealthEvent[]> => {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (type && type !== 'all') params.append('type', type);
      if (time && time !== 'all') params.append('time', time);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await this.request<HealthEvent[]>(`/events${qs}`);
      return res.data || [];
    },

    create: async (event: Partial<HealthEvent>): Promise<HealthEvent> => {
      const res = await this.request<HealthEvent>('/events', {
        method: 'POST',
        body: JSON.stringify(event)
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to save health event');
      }
      return res.data;
    },

    delete: async (id: string): Promise<boolean> => {
      const res = await this.request(`/events/${id}`, { method: 'DELETE' });
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete health event');
      }
      return true;
    },

    verify: async (id: string): Promise<HealthEvent | null> => {
      const res = await this.request<HealthEvent>(`/events/${id}/verify`, { method: 'PATCH' });
      return res.data || null;
    }
  };

  // --- Medications ---
  medications = {
    getAll: async (patientId?: string): Promise<Medication[]> => {
      const qs = patientId ? `?patientId=${patientId}` : '';
      const res = await this.request<Medication[]>(`/medications${qs}`);
      return res.data || [];
    },

    create: async (med: Partial<Medication>): Promise<Medication | null> => {
      const res = await this.request<Medication>('/medications', {
        method: 'POST',
        body: JSON.stringify(med)
      });
      return res.data || null;
    },

    toggleDose: async (
      medId: string,
      timeIdx: number,
      newStatus: MedicationScheduleItem['status'],
      reason?: string
    ): Promise<Medication | null> => {
      const res = await this.request<Medication>(`/medications/${medId}/dose`, {
        method: 'PATCH',
        body: JSON.stringify({ timeIdx, newStatus, reason })
      });
      return res.data || null;
    }
  };

  // --- Vitals ---
  vitals = {
    getAll: async (patientId?: string): Promise<VitalRecord[]> => {
      const qs = patientId ? `?patientId=${patientId}` : '';
      const res = await this.request<VitalRecord[]>(`/vitals${qs}`);
      return res.data || [];
    },

    create: async (vital: Partial<VitalRecord>): Promise<VitalRecord | null> => {
      const res = await this.request<VitalRecord>('/vitals', {
        method: 'POST',
        body: JSON.stringify(vital)
      });
      return res.data || null;
    }
  };

  // --- Reports ---
  reports = {
    getAll: async (patientId?: string): Promise<MedicalReport[]> => {
      const qs = patientId ? `?patientId=${patientId}` : '';
      const res = await this.request<MedicalReport[]>(`/reports${qs}`);
      return res.data || [];
    },

    create: async (report: Partial<MedicalReport>): Promise<MedicalReport | null> => {
      const res = await this.request<MedicalReport>('/reports', {
        method: 'POST',
        body: JSON.stringify(report)
      });
      return res.data || null;
    }
  };

  // --- Handover AI ---
  handover = {
    getSummary: async (patientId: string, timespan?: string): Promise<HandoverSummary | null> => {
      const qs = timespan ? `?timespan=${timespan}` : '';
      const res = await this.request<HandoverSummary>(`/handover/${patientId}${qs}`);
      return res.data || null;
    }
  };

  // --- AI patient overview (doctor-only; Gemini + ChromaDB run on the server) ---
  ai = {
    patientOverview: async (patientId: string): Promise<{ success: boolean; data?: AIOverviewData; error?: string }> => {
      const res = await this.request<AIOverviewData>('/ai/patient-overview', {
        method: 'POST',
        body: JSON.stringify({ patientId })
      });
      return res.success && res.data ? { success: true, data: res.data } : { success: false, error: res.error };
    }
  };

  // --- Audit Logs ---
  audit = {
    getAll: async (patientId?: string): Promise<AuditLogItem[]> => {
      const qs = patientId ? `?patientId=${patientId}` : '';
      const res = await this.request<AuditLogItem[]>(`/audit${qs}`);
      return res.data || [];
    },

    create: async (log: Partial<AuditLogItem>): Promise<AuditLogItem | null> => {
      const res = await this.request<AuditLogItem>('/audit', {
        method: 'POST',
        body: JSON.stringify(log)
      });
      return res.data || null;
    }
  };

  // --- Shares ---
  shares = {
    create: async (patientId: string, scope = '72h', expiryHours = 24): Promise<any> => {
      const res = await this.request<any>('/share', {
        method: 'POST',
        body: JSON.stringify({ patientId, scope, expiryHours })
      });
      return res.data || null;
    },

    get: async (token: string): Promise<any> => {
      const res = await this.request<any>(`/share/${token}`);
      return res.data || null;
    }
  };

  // --- Reset demo database ---
  async resetBackend(): Promise<boolean> {
    const res = await this.request('/reset', { method: 'POST' });
    return !!res.success;
  }
}

export const api = new ApiClient();
