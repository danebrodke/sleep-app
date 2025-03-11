'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SleepDataWithNotes } from '@/lib/types';
import { formatDate, formatDuration, formatTime, formatSleepEfficiency, getSleepStagePercentage } from '@/lib/sleep-utils';
import { upsertSleepNote } from '@/lib/sleep-notes-service';
import { Badge } from '@/components/ui/badge';

interface SleepCardProps {
  sleepData: SleepDataWithNotes;
  onNotesUpdated: () => void;
}

export default function SleepCard({ sleepData, onNotesUpdated }: SleepCardProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize notes after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setNotes(sleepData.notes?.notes || '');
  }, [sleepData.notes?.notes]);

  // Focus the textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveNotes = async () => {
    try {
      setSaveError(null);
      setIsSubmitting(true);
      const result = await upsertSleepNote(sleepData.day, notes);
      
      if (result) {
        // Update the local state with the new note data
        sleepData.notes = result;
        setNotes(result.notes);
        setIsDialogOpen(false);
        setIsEditing(false);
      } else {
        setSaveError('Failed to save notes. The database might not be set up correctly.');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveError('An unexpected error occurred while saving notes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotesClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (notes !== sleepData.notes?.notes) {
      handleSaveNotes();
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setNotes(sleepData.notes?.notes || '');
    } else if (e.key === 'Enter') {
      handleSaveNotes();
    }
  };

  // Calculate sleep quality score (0-100)
  const sleepScore = sleepData.score || 0;
  
  // Get color based on sleep score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Try to get the score from different possible sources
  const getDisplayScore = () => {
    // If we have a valid score directly, use it
    if (sleepData.score && sleepData.score > 0) {
      return sleepData.score;
    }
    
    // Try to get score from raw data if available
    if (sleepData._rawData) {
      const rawData = sleepData._rawData;
      
      // Check direct score property
      if (rawData.score) {
        return rawData.score;
      }
      
      // Check contributors.score.value
      if (rawData.contributors && rawData.contributors.score && rawData.contributors.score.value) {
        return rawData.contributors.score.value;
      }
    }
    
    // If all else fails, return 'N/A'
    return 'N/A';
  };
  
  const displayScore = getDisplayScore();
  const isValidScore = displayScore !== 'N/A';

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-medium">
            {formatDate(sleepData.day)}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {formatTime(sleepData.bedtime_start)} - {formatTime(sleepData.bedtime_end)}
          </div>
        </div>
        <Badge 
          className={`${
            isValidScore && displayScore >= 75 ? 'bg-emerald-800 text-emerald-200' : 
            isValidScore && displayScore >= 60 ? 'bg-amber-800 text-amber-200' :
            isValidScore && displayScore > 0 ? 'bg-red-800 text-red-200' :
            'bg-gray-800 text-gray-200'
          } font-medium hover:no-underline`}
          title="Sleep Score"
          variant="outline"
        >
          {displayScore}
        </Badge>
      </CardHeader>
      
      <CardContent className="pb-0 pt-0">
        {/* Sleep metrics in a compact grid */}
        <div className="grid grid-cols-3 gap-1 text-xs mb-2">
          <div className="flex flex-col items-center p-1 bg-secondary rounded">
            <span className="font-semibold text-sm">{formatDuration(sleepData.total_sleep_duration)}</span>
            <span className="text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col items-center p-1 bg-blue-950 rounded">
            <span className="font-semibold text-sm">{formatDuration(sleepData.deep_sleep_duration)}</span>
            <span className="text-muted-foreground">Deep</span>
          </div>
          <div className="flex flex-col items-center p-1 bg-pink-950 rounded">
            <span className="font-semibold text-sm">{formatDuration(sleepData.rem_sleep_duration)}</span>
            <span className="text-muted-foreground">REM</span>
          </div>
        </div>

        {/* Notes section with inline editing */}
        {isMounted && (
          <div 
            className={`mt-1 p-2 rounded cursor-pointer transition-colors ${
              isEditing ? 'bg-secondary/70' : sleepData.notes?.notes ? 'bg-secondary/50 hover:bg-secondary/70' : 'hover:bg-secondary/30'
            }`}
            onClick={!isEditing ? handleNotesClick : undefined}
          >
            <div className="font-medium text-xs mb-0">Notes</div>
            {isEditing ? (
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Add notes about your sleep..."
                  className="min-h-[60px] text-sm resize-none bg-secondary/70 border-secondary"
                  autoFocus
                />
                {isSubmitting && (
                  <div className="absolute right-2 top-2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
                {saveError && (
                  <div className="text-xs text-red-500 mt-1">
                    {saveError}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-0">
                  Press Esc to cancel, Enter to save
                </div>
              </div>
            ) : (
              <div className="text-sm min-h-[24px]">
                {sleepData.notes?.notes || (
                  <span className="text-muted-foreground italic">No notes added</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        {/* Removed the button for editing notes */}
      </CardFooter>
    </Card>
  );
} 