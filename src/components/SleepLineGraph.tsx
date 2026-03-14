'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { SleepData } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { memo } from 'react';

interface SleepLineGraphProps {
  sleepData: SleepData[];
}

const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-3 rounded shadow-lg border border-gray-700">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {entry.value} hours
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const SleepLineGraph = memo(({ sleepData }: SleepLineGraphProps) => {
  const chartData = useMemo(() => {
    return sleepData.map(item => {
      const totalSleepHours = item.total_sleep_duration / 3600;
      const deepSleepHours = item.deep_sleep_duration / 3600;
      const remSleepHours = item.rem_sleep_duration / 3600;
      const date = parseISO(item.day);

      return {
        date: format(date, 'EEE MMM d'),
        totalSleep: parseFloat(totalSleepHours.toFixed(1)),
        deepSleep: parseFloat(deepSleepHours.toFixed(1)),
        remSleep: parseFloat(remSleepHours.toFixed(1)),
        rawDate: date,
      };
    }).reverse();
  }, [sleepData]);

  const limitedChartData = useMemo(() => {
    if (chartData.length <= 12) return chartData;

    const step = Math.ceil(chartData.length / 12);
    const result = [];

    for (let i = 0; i < chartData.length; i += step) {
      if (result.length < 11) {
        result.push(chartData[i]);
      }
    }

    if (chartData.length > 0 && !result.includes(chartData[chartData.length - 1])) {
      result.push(chartData[chartData.length - 1]);
    }

    return result.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [chartData]);

  const maxSleepHours = useMemo(() => {
    if (chartData.length === 0) return 10;
    const maxTotal = Math.max(...chartData.map(d => d.totalSleep));
    return Math.ceil(maxTotal / 2) * 2;
  }, [chartData]);

  const yAxisTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxSleepHours; i += 2) {
      ticks.push(i);
    }
    return ticks;
  }, [maxSleepHours]);

  return (
    <div className="w-full h-[400px] bg-card rounded-lg p-4 shadow">
      <h3 className="text-lg font-medium mb-4">Sleep Duration Trends</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={limitedChartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={true} vertical={false} />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
          <YAxis
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            domain={[0, maxSleepHours]}
            ticks={yAxisTicks}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="totalSleep" name="Total Sleep" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="deepSleep" name="Deep Sleep" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="remSleep" name="REM Sleep" stroke="#ffc658" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

SleepLineGraph.displayName = 'SleepLineGraph';

export default SleepLineGraph;
