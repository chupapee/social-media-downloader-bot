import { getEnvVar } from './config.service';

export const SUPABASE_PROJECT_URL = getEnvVar('SUPABASE_PROJECT_URL');
export const SUPABASE_API_KEY = getEnvVar('SUPABASE_API_KEY');
