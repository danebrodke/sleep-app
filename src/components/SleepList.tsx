'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SleepDataWithNotes } from '@/lib/types';
import { formatDate, formatDuration, formatTime, getSleepStagePercentage } from '@/lib/sleep-utils';
import { upsertSleepNote } from '@/lib/sleep-notes-service';

interface SleepListProps {
  sleepData: SleepDataWithNotes[];
  onNotesUpdated: () => void;
}

export default function SleepList({ sleepData, onNotesUpdated }: SleepListProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenDialog = (day: string, existingNotes: string = '') => {
    setSelectedDay(day);
    setNotes(existingNotes);
    setIsDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedDay) return;
    
    try {
      setSaveError(null);
      setIsSubmitting(true);
      const result = await upsertSleepNote(selectedDay, notes);
      
      if (result) {
        onNotesUpdated();
        setIsDialogOpen(false);
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

  // Get color based on sleep score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[80px] text-center">Total</TableHead>
            <TableHead className="w-[80px] text-center">Deep</TableHead>
            <TableHead className="w-[80px] text-center">REM</TableHead>
            <TableHead className="w-[80px] text-center">Efficiency</TableHead>
            <TableHead className="w-[120px]">Notes</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sleepData.map((item) => {
            const hasNotes = !!item.notes?.notes;
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-xs">
                  {formatDate(item.day)}
                  <div className="text-xs text-muted-foreground">
                    {formatTime(item.bedtime_start).replace(' ', '')} - {formatTime(item.bedtime_end).replace(' ', '')}
                  </div>
                </TableCell>
                <TableCell className="text-center text-xs">
                  {formatDuration(item.total_sleep_duration)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {formatDuration(item.deep_sleep_duration)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {formatDuration(item.rem_sleep_duration)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  <Badge 
                    className={`${
                      item.efficiency >= 85 ? 'bg-emerald-800 text-emerald-200' : 
                      item.efficiency >= 70 ? 'bg-amber-800 text-amber-200' : 
                      'bg-rose-900 text-rose-200'
                    } font-medium hover:no-underline`}
                    variant="outline"
                  >
                    {Math.round(item.efficiency)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {hasNotes ? (
                    <div className="line-clamp-2">{item.notes?.notes}</div>
                  ) : (
                    <span className="text-muted-foreground italic">No notes</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-full text-xs"
                    onClick={() => handleOpenDialog(item.day, item.notes?.notes || '')}
                  >
                    {hasNotes ? 'Edit' : 'Add'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sleep Notes for {selectedDay ? formatDate(selectedDay) : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your sleep..."
                rows={5}
              />
            </div>
            
            {saveError && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                {saveError}
                <p className="mt-1">
                  Note: Make sure you've set up the Supabase database by running the SQL script.
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleSaveNotes} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 