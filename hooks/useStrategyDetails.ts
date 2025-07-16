import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/lib/env'
import { StrategyDetails } from '@/types'

export function useStrategyDetails(strategyId: string, leverage: number) {
  const [data, setData] = useState<StrategyDetails[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/strategies/${encodeURIComponent(strategyId)}/details/${leverage}`)

        if (!response.ok) {
          console.error('Error fetching strategy details:', response.status)
          setError('Failed to load strategy details')
          return
        }

        const data = await response.json()
        // Convert date strings to Date objects
        const processedData = data.map((item: any) => ({
          ...item,
          day: new Date(item.day)
        }))

        setData(processedData)
        setError(null)
      } catch (err) {
        console.error('Error fetching strategy details:', err)
        setError('Failed to load strategy details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [strategyId, leverage])

  return { data, loading, error }
}
