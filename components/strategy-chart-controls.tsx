import React from 'react'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { ChartDataConfig } from "@/components/strategy-chart"

type StrategyChartControlsProps = {
  leverage: number
  onLeverageChange: (value: number) => void
  dataConfig: ChartDataConfig[]
  onDataConfigChange: (config: ChartDataConfig[]) => void
}

export function StrategyChartControls({
  leverage,
  onLeverageChange,
  dataConfig,
  onDataConfigChange
}: StrategyChartControlsProps) {
  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      onLeverageChange(value)
    }
  }

  const handleCheckboxChange = (dataKey: string, checked: boolean) => {
    const updatedConfig = dataConfig.map(config => {
      if (config.dataKey === dataKey) {
        return { ...config, enabled: checked }
      }
      return config
    })
    onDataConfigChange(updatedConfig)
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="leverage" className="block text-sm font-medium mb-1">
          Leverage
        </label>
        <Input
          id="leverage"
          type="number"
          min="1"
          step="0.1"
          value={leverage}
          onChange={handleLeverageChange}
          className="w-full max-w-xs"
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Chart Data</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {dataConfig.map((config) => (
            <div key={config.dataKey} className="flex items-center space-x-2">
              <Checkbox
                id={`checkbox-${config.dataKey}`}
                checked={config.enabled}
                onChange={(e) => handleCheckboxChange(config.dataKey, e.target.checked)}
              />
              <label
                htmlFor={`checkbox-${config.dataKey}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                style={{ color: config.color }}
              >
                {config.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
