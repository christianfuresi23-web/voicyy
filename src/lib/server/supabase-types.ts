export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmptySchemaObjects = Record<never, never>;

/**
 * Only the public write-only RPC surface is represented here. PII tables live
 * in the unexposed private schema and are intentionally absent from Data API
 * types so application code cannot accidentally call `.from("agent_requests")`.
 */
export type Database = {
  public: {
    Tables: EmptySchemaObjects;
    Views: EmptySchemaObjects;
    Functions: {
      submit_agent_request: {
        Args: {
          p_write_secret: string;
          p_submission_id: string;
          p_ip_key_hash: string;
          p_recipient_key_hash: string;
          p_payload_ciphertext: string;
          p_payload_iv: string;
          p_payload_auth_tag: string;
          p_encryption_version: number;
          p_terms_accepted: boolean;
          p_marketing_consent: boolean;
        };
        Returns: Array<{
          accepted: boolean;
          reference_code: string | null;
          client_email_status: string | null;
          inserted: boolean;
          retry_after_seconds: number;
        }>;
      };
      update_agent_request_delivery: {
        Args: {
          p_write_secret: string;
          p_submission_id: string;
          p_reference_code: string;
          p_delivery: Json;
        };
        Returns: boolean;
      };
    };
    Enums: EmptySchemaObjects;
    CompositeTypes: EmptySchemaObjects;
  };
};
