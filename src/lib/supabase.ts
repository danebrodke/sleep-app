import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tsgmndnruzecebdvwusk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ21uZG5ydXplY2ViZHZ3dXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDQ5NjksImV4cCI6MjA1NjY4MDk2OX0.yz-CdkNoBhy-4a_HeGyYj783Hd3c4EU8VvbC8i0miFI';

export const supabase = createClient(supabaseUrl, supabaseKey); 