export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ServiceItem = { name: string; durationHours: number };
export type WorkingSchedule = {
  start: string;
  end: string;
  secondStart?: string;
  secondEnd?: string;
};
export type AgentConfiguration = {
  llm: string;
  textToSpeech: string;
  telephony: string;
  minutes: number;
  estimatedMonthlyPrice: number | null;
};

type AgentRequestRow = {
  id: string;
  submission_id: string;
  reference_code: string;
  status: string;
  contact_name: string;
  business_name: string;
  contact_email: string;
  notification_email: string;
  phone: string;
  website: string | null;
  details: string;
  services: ServiceItem[];
  working_days: string[];
  schedule: WorkingSchedule;
  hours_per_day: number;
  calendar_email: string;
  drive_folder_id: string | null;
  llm: string;
  text_to_speech: string;
  telephony: string;
  monthly_minutes: number;
  estimated_monthly_price: number | null;
  configuration: AgentConfiguration;
  terms_accepted: boolean;
  terms_version: string;
  privacy_version: string;
  marketing_consent: boolean;
  marketing_consent_version: string | null;
  marketing_consented_at: string | null;
  consented_at: string;
  admin_email_status: string;
  admin_email_id: string | null;
  admin_email_error: string | null;
  admin_email_attempted_at: string | null;
  admin_email_accepted_at: string | null;
  client_email_status: string;
  client_email_id: string | null;
  client_email_error: string | null;
  client_email_attempted_at: string | null;
  client_email_accepted_at: string | null;
  drive_status: string;
  drive_file_id: string | null;
  drive_error: string | null;
  created_at: string;
  updated_at: string;
};

type AdminSettingsRow = {
  id: number;
  totp_secret_encrypted: string | null;
  totp_enabled: boolean;
  totp_confirmed_at: string | null;
  last_totp_time_step: number | null;
  created_at: string;
  updated_at: string;
};

type AdminAuthFlowRow = {
  jti_hash: string;
  fingerprint_hash: string;
  step: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

type AdminSessionRow = {
  jti_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

type AdminLoginAttemptRow = {
  id: string;
  fingerprint_hash: string;
  ip_hash: string;
  user_agent_hash: string;
  stage: string;
  successful: boolean;
  reason: string | null;
  created_at: string;
};

type RateLimitBucketRow = {
  scope: string;
  key_hash: string;
  window_started_at: string;
  request_count: number;
  updated_at: string;
};

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      agent_requests: Table<
        AgentRequestRow,
        Omit<
          AgentRequestRow,
          | "id"
          | "status"
          | "created_at"
          | "updated_at"
          | "admin_email_status"
          | "client_email_status"
          | "drive_status"
          | "admin_email_id"
          | "admin_email_error"
          | "admin_email_attempted_at"
          | "admin_email_accepted_at"
          | "client_email_id"
          | "client_email_error"
          | "client_email_attempted_at"
          | "client_email_accepted_at"
          | "drive_file_id"
          | "drive_error"
        > & {
          id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          admin_email_status?: string;
          client_email_status?: string;
          drive_status?: string;
          admin_email_id?: string | null;
          admin_email_error?: string | null;
          admin_email_attempted_at?: string | null;
          admin_email_accepted_at?: string | null;
          client_email_id?: string | null;
          client_email_error?: string | null;
          client_email_attempted_at?: string | null;
          client_email_accepted_at?: string | null;
          drive_file_id?: string | null;
          drive_error?: string | null;
        }
      >;
      admin_settings: Table<
        AdminSettingsRow,
        {
          id: number;
          totp_secret_encrypted?: string | null;
          totp_enabled?: boolean;
          totp_confirmed_at?: string | null;
          last_totp_time_step?: number | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      admin_login_attempts: Table<
        AdminLoginAttemptRow,
        {
          id?: string;
          fingerprint_hash: string;
          ip_hash: string;
          user_agent_hash: string;
          stage: string;
          successful: boolean;
          reason?: string | null;
          created_at?: string;
        }
      >;
      rate_limit_buckets: Table<
        RateLimitBucketRow,
        {
          scope: string;
          key_hash: string;
          window_started_at: string;
          request_count?: number;
          updated_at?: string;
        }
      >;
      admin_auth_flows: Table<
        AdminAuthFlowRow,
        {
          jti_hash: string;
          fingerprint_hash: string;
          step: string;
          expires_at: string;
          consumed_at?: string | null;
          created_at?: string;
        }
      >;
      admin_sessions: Table<
        AdminSessionRow,
        {
          jti_hash: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        }
      >;
    };
    Views: Record<never, never>;
    Functions: {
      consume_rate_limit: {
        Args: {
          p_scope: string;
          p_key_hash: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: Array<{
          allowed: boolean;
          retry_after_seconds: number;
        }>;
      };
      consume_totp_time_step: {
        Args: { p_time_step: number };
        Returns: boolean;
      };
      enforce_data_retention: {
        Args: Record<never, never>;
        Returns: Array<{
          expired_marketing_consents: number;
          deleted_admin_attempts: number;
          deleted_rate_buckets: number;
          deleted_auth_flows: number;
          deleted_admin_sessions: number;
        }>;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type AgentRequest = AgentRequestRow;
export type AdminSettings = AdminSettingsRow;
