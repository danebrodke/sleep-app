import { supabase } from './supabase';
import { SleepNote } from './types';

export async function getSleepNotes(startDate: string, endDate: string): Promise<SleepNote[]> {
  try {
    console.log(`Fetching sleep notes from ${startDate} to ${endDate}`);
    
    const { data, error } = await supabase
      .from('sleep_notes')
      .select('*')
      .gte('sleep_date', startDate)
      .lte('sleep_date', endDate)
      .order('sleep_date', { ascending: false });

    if (error) {
      console.error('Error fetching sleep notes:', error);
      // Return empty array instead of throwing
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching sleep notes:', error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function getSleepNoteByDate(date: string): Promise<SleepNote | null> {
  try {
    const { data, error } = await supabase
      .from('sleep_notes')
      .select('*')
      .eq('sleep_date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      console.error('Error fetching sleep note:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching sleep note:', error);
    return null;
  }
}

export async function createSleepNote(sleepDate: string, notes: string): Promise<SleepNote | null> {
  try {
    const { data, error } = await supabase
      .from('sleep_notes')
      .insert([{ sleep_date: sleepDate, notes }])
      .select()
      .single();

    if (error) {
      console.error('Error creating sleep note:', error);
      
      // If the table doesn't exist yet, log a helpful message
      if (error.code === '42P01') {
        console.error('Table "sleep_notes" does not exist. Please run the SQL setup script.');
      }
      
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception creating sleep note:', error);
    return null;
  }
}

export async function updateSleepNote(id: string, notes: string): Promise<SleepNote | null> {
  try {
    const { data, error } = await supabase
      .from('sleep_notes')
      .update({ notes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sleep note:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception updating sleep note:', error);
    return null;
  }
}

export async function upsertSleepNote(sleepDate: string, notes: string): Promise<SleepNote | null> {
  try {
    const { data, error } = await supabase
      .from('sleep_notes')
      .upsert({ sleep_date: sleepDate, notes }, { onConflict: 'sleep_date' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting sleep note:', error);
      
      // If the table doesn't exist yet, try to create it
      if (error.code === '42P01') {
        console.error('Table "sleep_notes" does not exist. Please run the SQL setup script.');
        return createFallbackNote(sleepDate, notes);
      }
      
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception upserting sleep note:', error);
    return null;
  }
}

// Create a fallback note object when database operations fail
function createFallbackNote(sleepDate: string, notes: string): SleepNote {
  return {
    id: `local-${Date.now()}`,
    sleep_date: sleepDate,
    notes: notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 