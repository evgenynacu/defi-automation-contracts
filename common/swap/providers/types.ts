import { address } from "../../types"

export type SwapParams = {
  chainId: number
  vault: address
  swapAmount: bigint
  fromToken: address
  toToken: address
  txOrigin: address
  decimalsIn: number
  decimalsOut: number
}

export type SwapResult = {
  outAmount: bigint
  to: address
  data: `0x${string}`
}

export type ProviderConfig = {
  name: string
  enabled: boolean
}