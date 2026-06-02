import { getDisplayValue, getDisplayValues, getRawValues } from '../services/domain'
import { PanelHeader } from './Toolbar'

export function TimeSeriesPanel({ column }) {
  const rawValues = getRawValues(column)
  const values = getDisplayValues(column)
  const primaryThreshold = column.thresholds[0]
  const upper = typeof primaryThreshold?.upper === 'number' ? getDisplayValue(column, primaryThreshold.upper) : primaryThreshold?.upper
  const lower = typeof primaryThreshold?.lower === 'number' ? getDisplayValue(column, primaryThreshold.lower) : primaryThreshold?.lower
  const numericValues = [upper, lower, ...values].filter((value) => typeof value === 'number')
  const minValue = Math.min(...numericValues)
  const maxValue = Math.max(...numericValues)
  const padding = Math.max((maxValue - minValue) * 0.18, 1)
  const chartMin = minValue - padding
  const chartMax = maxValue + padding
  const range = chartMax - chartMin || 1

  const toX = (index) => 40 + (index * 520) / (values.length - 1)
  const toY = (value) => 210 - ((value - chartMin) / range) * 160
  const points = values.map((value, index) => `${toX(index)},${toY(value)}`).join(' ')
  const lastValue = values.at(-1)

  return (
    <article className="panel graph-panel">
      <PanelHeader
        title={`${column.label} (${column.key})`}
        detail={`型: ${column.type} / 重み: ${column.weight ?? 1} / 表示値 = 受信値 × 重み`}
      />
      <div className="line-chart-frame">
        <svg viewBox="0 0 600 240" role="img" aria-label={`${column.label} の時系列グラフ`}>
          <g className="grid-lines">
            {[50, 90, 130, 170, 210].map((y) => (
              <line key={y} x1="40" x2="560" y1={y} y2={y} />
            ))}
          </g>
          {typeof upper === 'number' && (
            <line className="threshold-line upper" x1="40" x2="560" y1={toY(upper)} y2={toY(upper)} />
          )}
          {typeof lower === 'number' && (
            <line className="threshold-line lower" x1="40" x2="560" y1={toY(lower)} y2={toY(lower)} />
          )}
          <polyline className="series-line" points={points} />
          {values.map((value, index) => {
            const exceeded =
              (typeof upper === 'number' && value > upper) ||
              (typeof lower === 'number' && value < lower)

            return (
              <circle
                className={exceeded ? 'data-point exceeded' : 'data-point'}
                cx={toX(index)}
                cy={toY(value)}
                key={`${column.key}-${index}`}
                r={exceeded ? 5 : 3.5}
              />
            )
          })}
          <text className="axis-label" x="40" y="228">-24h</text>
          <text className="axis-label" x="520" y="228">now</text>
        </svg>
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
