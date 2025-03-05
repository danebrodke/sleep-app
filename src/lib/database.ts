import { createClient } from '@supabase/supabase-js';
import { OuraSleepData } from './oura-api';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save sleep data to the Supabase database
 * @param sleepData Array of sleep data to save
 * @returns Promise that resolves when data is saved
 */
export async function saveSleepDataToDatabase(sleepData: OuraSleepData[]): Promise<void> {
  if (!sleepData || sleepData.length === 0) {
    console.log('No sleep data to save to database');
    return;
  }

  try {
    console.log(`Saving ${sleepData.length} sleep records to database`);
    
    // Process each sleep record
    for (const record of sleepData) {
      // Check if record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('sleep_data')
        .select('id')
        .eq('day', record.day)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing record:', checkError);
        continue;
      }
      
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('sleep_data')
          .update(record)
          .eq('day', record.day);
        
        if (updateError) {
          console.error('Error updating sleep record:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('sleep_data')
          .insert(record);
        
        if (insertError) {
          console.error('Error inserting sleep record:', insertError);
        }
      }
    }
    
    console.log('Sleep data saved to database successfully');
  } catch (error) {
    console.error('Error saving sleep data to database:', error);
    throw error;
  }
} 