
import React, { useMemo } from 'react';
import { PerformancePoint } from '../types';

interface Props {
  data: PerformancePoint[];
  width?: string;
  height?: number;
  className?: string;
}

export const PortfolioChart: React.FC<Props> = ({ data, height = 60, className = '' }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { path: '', areaPath: '', min: 0, max: 0, lastValue: 0 };

    // If only one point, create a fake previous point to draw a flat line
    let points = data;
    if (data.length === 1) {
        points = [
            { timestamp: data[0].timestamp - 3600000, value: data[0].value },
            { timestamp: data[0].timestamp, value: data[0].value }
        ];
    }

    // Sort by timestamp just in case
    points = [...points].sort((a, b) => a.timestamp - b.timestamp);

    const values = points.map(p => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    
    // Add some padding to the Y axis range
    const range = maxVal - minVal;
    const yMin = minVal - (range * 0.1); 
    const yMax = maxVal + (range * 0.1);
    const yRange = yMax - yMin || 1; // avoid divide by zero

    const minTime = points[0].timestamp;
    const maxTime = points[points.length - 1].timestamp;
    const timeRange = maxTime - minTime || 1;

    const width = 300; // Internal coordinate system width
    const chartHeight = 100; // Internal coordinate system height

    const coords = points.map(p => {
      const x = ((p.timestamp - minTime) / timeRange) * width;
      const y = chartHeight - ((p.value - yMin) / yRange) * chartHeight;
      return `${x},${y}`;
    });

    const linePath = `M ${coords.join(' L ')}`;
    const areaPath = `M ${coords[0].split(',')[0]},${chartHeight} L ${coords.join(' L ')} L ${coords[coords.length - 1].split(',')[0]},${chartHeight} Z`;

    return { 
        path: linePath, 
        areaPath, 
        min: minVal, 
        max: maxVal, 
        lastValue: values[values.length - 1] 
    };
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
        <svg 
            viewBox="0 0 300 100" 
            preserveAspectRatio="none" 
            className="w-full h-full overflow-visible"
        >
            <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={chartData.areaPath} fill="url(#portfolioGradient)" />
            <path 
                d={chartData.path} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    </div>
  );
};
