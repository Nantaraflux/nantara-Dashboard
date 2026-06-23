import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export default function RevenueChart({ data }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        data: data.map(d => d.revenue),
        borderColor: '#0F6E56',
        backgroundColor: 'rgba(15, 110, 86, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#1D9E75',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#1A2235',
        borderColor: '#1F2D40',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        callbacks: {
          label: (ctx) => `Rp ${ctx.raw.toLocaleString('id-ID')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#4A5568', font: { size: 11, family: 'Inter' }, maxTicksLimit: 8 },
        border: { display: false },
      },
      y: {
        grid: { color: '#1F2D40', lineWidth: 0.5 },
        ticks: {
          color: '#4A5568',
          font: { size: 11, family: 'Inter' },
          callback: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
        },
        border: { display: false },
      },
    },
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="text-label text-txt-secondary mb-3">Revenue Trend (30 Days)</div>
      <div className="h-[200px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
