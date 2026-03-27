import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://vdwvunfajvidgrwocjpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkd3Z1bmZhanZpZGdyd29janBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Njc5NDYsImV4cCI6MjA4NzA0Mzk0Nn0.8PgQgUseYin90-V3tkYJaqXdU3C3EsybmYmu2XZC_qM'
export const supabase = createClient(supabaseUrl, supabaseKey)