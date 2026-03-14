'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SleepData } from '@/lib/types';
import { formatDate, formatDuration, formatTime } from '@/lib/sleep-utils';

interface SleepListProps {
  sleepData: SleepData[];
}

export default function SleepList({ sleepData }: SleepListProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[80px] text-center">Total</TableHead>
            <TableHead className="w-[80px] text-center">Deep</TableHead>
            <TableHead className="w-[80px] text-center">REM</TableHead>
            <TableHead className="w-[80px] text-center">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sleepData.map((item) => (
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
                    item.score >= 75 ? 'bg-emerald-800 text-emerald-200' :
                    'bg-amber-800 text-amber-200'
                  } font-medium hover:no-underline`}
                  variant="outline"
                >
                  {item.score || 0}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
