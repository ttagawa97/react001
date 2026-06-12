import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getDisplayValue, getDisplayValues, getRawValues } from '../services/domain'
import { PanelHeader } from './Toolbar'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

function formatAxisTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function thresholdDataset(label, value, color, pointCount) {
  if (typeof value !== 'number') return null
  return {
    label,
    data: Array(pointCount).fill(value),
    borderColor: color,
    borderDash: [7, 6],
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    tension: 0,
  }
}

export function TimeSeriesPanel({ column }) {
  const rawValues = getRawValues(column)
  const values = getDisplayValues(column).filter((value) => typeof value === 'number' && Number.isFinite(value))
  if (values.length === 0) return null

  const primaryThreshold = column.thresholds[0]
  const upper = typeof primaryThreshold?.upper === 'number'
    ? getDisplayValue(column, primaryThreshold.upper)
    : primaryThreshold?.upper
  const lower = typeof primaryThreshold?.lower === 'number'
    ? getDisplayValue(column, primaryThreshold.lower)
    : primaryThreshold?.lower
  const labels = values.map((_, index) => formatAxisTime(column.timestamps?.[index]))
  const pointExceeded = (value) => (
    (typeof upper === 'number' && value > upper) ||
    (typeof lower === 'number' && value < lower)
  )
  const thresholdDatasets = [
    thresholdDataset('上限値', upper, '#dc2626', values.length),
    thresholdDataset('下限値', lower, '#2563eb', values.length),
  ].filter(Boolean)
  const data = {
    labels,
    datasets: [
      {
        label: column.label,
        data: values,
        borderColor: '#15916f',
        backgroundColor: 'rgba(21, 145, 111, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: values.map((value) => pointExceeded(value) ? '#dc2626' : '#ffffff'),
        pointBorderColor: values.map((value) => pointExceeded(value) ? '#991b1b' : '#15916f'),
        pointBorderWidth: 2,
        pointRadius: values.map((value) => pointExceeded(value) ? 5 : 3.5),
        pointHoverRadius: 6,
        fill: true,
        tension: 0.25,
      },
      ...thresholdDatasets,
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: thresholdDatasets.length > 0,
        position: 'top',
        labels: {
          boxWidth: 24,
          color: '#475569',
          filter: (item) => item.datasetIndex > 0,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.formattedValue}${column.unit ? ` ${column.unit}` : ''}`,
          afterBody: (items) => {
            const index = items[0]?.dataIndex
            if (index === undefined) return []
            return `受信生値: ${rawValues[index]}${column.unit ? ` ${column.unit}` : ''}`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '日時',
          color: '#334155',
          font: { weight: 'bold' },
        },
        ticks: {
          autoSkip: true,
          color: '#475569',
          maxRotation: 0,
          maxTicksLimit: 6,
        },
        grid: { color: '#e2e8f0' },
      },
      y: {
        title: {
          display: true,
          text: column.unit || column.label,
          color: '#334155',
          font: { weight: 'bold' },
        },
        ticks: { color: '#475569' },
        grid: { color: '#e2e8f0' },
      },
    },
  }
  const lastValue = values.at(-1)

  return (
    <article className="panel graph-panel">
      <PanelHeader
        title={`${column.label} (${column.key})`}
        detail={`型: ${column.type} / 重み: ${column.weight ?? 1} / 表示値 = 受信値 × 重み`}
      />
      <div className="line-chart-frame">
        <Line data={data} options={options} aria-label={`${column.label} の時系列グラフ`} />
      </div>
      <div className="graph-meta">
        <span>最新値: {lastValue} {column.unit}</span>
        <span>受信生値: {rawValues.at(-1)} {column.unit}</span>
        <span>最小: {Math.min(...values)} {column.unit}</span>
        <span>最大: {Math.max(...values)} {column.unit}</span>
      </div>
    </article>
  )
}
