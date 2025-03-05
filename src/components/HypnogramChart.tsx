'use client';

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables, ScriptableContext } from 'chart.js';
import { parseHypnogram } from '@/lib/oura-api';
import { getHypnogramColors } from '@/lib/sleep-utils';

Chart.register(...registerables);

interface HypnogramChartProps {
  hypnogramData: string;
  height?: number;
}

export default function HypnogramChart({ hypnogramData, height = 100 }: HypnogramChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !chartRef.current || !hypnogramData) return;

    // Debug the hypnogram data
    console.log('HypnogramChart received data:', hypnogramData);
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const hypnogramValues = parseHypnogram(hypnogramData);
    console.log('Parsed hypnogram values:', hypnogramValues);
    
    const colors = getHypnogramColors();
    
    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: hypnogramValues.length }, (_, i) => i),
        datasets: [{
          label: 'Sleep Stages',
          data: hypnogramValues.map(value => 5 - value), // Invert values for better visualization (deep sleep at top)
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return undefined;
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.bottom);
            
            // Add color stops based on sleep stages
            gradient.addColorStop(0, colors[4]); // Awake
            gradient.addColorStop(0.25, colors[3]); // REM
            gradient.addColorStop(0.5, colors[2]); // Light
            gradient.addColorStop(0.75, colors[1]); // Deep
            
            return gradient;
          },
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false,
            min: 0,
            max: 4,
            ticks: {
              stepSize: 1
            }
          }
        },
        animation: {
          duration: 0
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [hypnogramData, isMounted]);

  // Return an empty div with the same dimensions during server rendering
  if (!isMounted) {
    return <div style={{ height: `${height}px`, width: '100%' }}></div>;
  }

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  );
} 