/*
 * File: contracts.ts
 * Purpose: Define auth-domain Supabase row contracts used for social login identity lookup.
 * Primary Responsibility: Keep auth persistence row shapes beside the auth implementation.
 * Design Intent: OAuth user provisioning owns these rows; they should not enlarge the global Worker type barrel.
 * Non-Goals: This file does not implement OAuth, session creation, or Supabase requests.
 * Dependencies: None beyond TypeScript structural typing.
 */
export interface SupabaseIdentityRow {
  identity_id: string | number;
  user_id: string;
  email?: string | null;
  profile_image?: string | null;
}

export interface SupabaseUserRow {
  user_id: string;
  nickname?: string | null;
  email?: string | null;
  provider?: string | null;
  profile_completed_at?: string | null;
}
