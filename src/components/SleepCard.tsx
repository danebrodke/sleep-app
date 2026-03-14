'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SleepData } from '@/lib/types';
import { formatDate, formatDuration, formatTime } from '@/lib/sleep-utils';
import { Badge } from '@/components/ui/badge';

interface SleepCardProps {
  sleepData: SleepData;
}

export default function SleepCard({ sleepData }: SleepCardProps) {
  const getDisplayScore = () => {
    if (sleepData.score && sleepData.score > 0) return sleepData.score;
    if (sleepData._rawData) {
      const rawData = sleepData._rawData;
      if (rawData.score) return rawData.score;
      if (rawData.contributors?.score?.value) return rawData.contributors.score.value;
    }
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

      <CardContent className="pb-3 pt-0">
        <div className="grid grid-cols-3 gap-1 text-xs">
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
      </CardContent>
    </Card>
  );
}
