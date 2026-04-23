// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =  'https://nbyfkwaphiclkghgzfss.supabase.co'; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieWZrd2FwaGljbGtnaGd6ZnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDEzMzksImV4cCI6MjA4NDMxNzMzOX0.2d_0rEjoWpu-rtVO-r3bYbD_yoHW4Oy4iGkK0NWahF0";  // Replace with your anon public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
