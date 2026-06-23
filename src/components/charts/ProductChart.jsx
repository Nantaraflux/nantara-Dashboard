import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function ProductChart({ data }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: '#0F6E56',
        hoverBackgroundColor: '#1D9E75',
        borderRadius: 3,
        barThickness: 20,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      tooltip: {
        backgroundColor: '#1A2235',
        borderColor: '#1F2D40',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: '#1F2D40', lineWidth: 0.5 },
        ticks: { color: '#4A5568', font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8B9AB0', font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
    },
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-md p-4">
      <div className="text-label text-txt-secondary mb-3">Top 5 Products</div>
      <div className="h-[200px]">
        {data.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-txt-tertiary text-[13px]">No product data</div>
        )}
      </div>
    </div>
  )
}
