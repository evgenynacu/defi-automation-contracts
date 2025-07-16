
"use client"

import { useState } from 'react'
import { ChartDataConfig, StrategyChart } from '@/components/strategy-chart'
import { StrategyChartControls } from '@/components/strategy-chart-controls'
import { useStrategyDetails } from '@/hooks/useStrategyDetails'

type StrategyChartClientProps = {
  strategyId: string
}

const defaultConfig: ChartDataConfig[] = [
  { dataKey: 'apr1d', color: '#10B981', label: 'APR', enabled: true },
  { dataKey: 'apr7d', color: '#059669', label: 'APR (7d avg)', enabled: true },
  { dataKey: 'apr30d', color: '#047857', label: 'APR (30d avg)', enabled: true },
  { dataKey: 'yieldRate1d', color: '#3B82F6', label: 'Yield Rate', enabled: true },
  { dataKey: 'yieldRate7d', color: '#2563EB', label: 'Yield Rate (7d avg)', enabled: false },
  { dataKey: 'yieldRate30d', color: '#1D4ED8', label: 'Yield Rate (30d avg)', enabled: false },
  { dataKey: 'borrowRate1d', color: '#EF4444', label: 'Borrow Rate', enabled: true },
  { dataKey: 'borrowRate7d', color: '#DC2626', label: 'Borrow Rate (7d avg)', enabled: false },
  { dataKey: 'borrowRate30d', color: '#B91C1C', label: 'Borrow Rate (30d avg)', enabled: false },
]

export function StrategyChartClient({ strategyId }: StrategyChartClientProps) {
  const [leverage, setLeverage] = useState<number>(5)
  const [dataConfig, setDataConfig] = useState<ChartDataConfig[]>(defaultConfig)

  const { data: chartData, loading, error } = useStrategyDetails(strategyId, leverage)

  const handleLeverageChange = (newLeverage: number) => {
    setLeverage(newLeverage)
  }

  if (loading) {
    return <div className="py-10 text-center">Loading chart data...</div>
  }

  if (error) {
    return <div className="py-10 text-center text-destructive">{error}</div>
  }

  return (
    <div className="space-y-6">
      <StrategyChartControls
        leverage={leverage}
        onLeverageChange={handleLeverageChange}
        dataConfig={dataConfig}
        onDataConfigChange={setDataConfig}
      />

      {chartData.length > 0 ? (
        <StrategyChart data={chartData} dataConfig={dataConfig} />
      ) : (
        <div className="py-10 text-center">No chart data available for this strategy.</div>
      )}
    </div>
  )
}