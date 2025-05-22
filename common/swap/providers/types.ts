import { address } from "../../types"
import { type ContractRunner } from "ethers"

export type SwapParams = {
  runner: ContractRunner
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