import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { StrategyDetails } from '@/types'
import { formatDate, formatPercent } from '@/lib/utils'

export type ChartDataConfig = {
  dataKey: keyof StrategyDetails
  color: string
  label: string
  enabled: boolean
}

type StrategyChartProps = {
  data: StrategyDetails[]
  dataConfig: ChartDataConfig[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md">
        <p className="font-medium">{formatDate(new Date(label))}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatPercent(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function StrategyChart({ data, dataConfig }: StrategyChartProps) {
  const enabledConfig = dataConfig.filter(config => config.enabled)

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
          <XAxis
            dataKey="day"
            tickFormatter={(date) => {
              const d = new Date(date)
              return `${d.getMonth()+1}/${d.getDate()}`
            }}
          />
          <YAxis tickFormatter={(value) => formatPercent(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {enabledConfig.map(config => (
            <Line
              key={config.dataKey.toString()}
              type="monotone"
              dataKey={config.dataKey.toString()}
              stroke={config.color}
              name={config.label}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
