import { address } from "./types"
import { getDecimals } from "./decimals"
import { testSwap } from "./test-swap"

export async function calculateAmountToSwap(from: address, to: address, toAmount: bigint): Promise<bigint> {
	const toAmountNumber = Number(toAmount) / (10 ** getDecimals(to))
	const fromAmount = BigInt(Math.floor(toAmountNumber * 10 ** getDecimals(from)))
	const testAmount = await testSwap(from, fromAmount, to)
	// proportion
	// fromAmount => testAmount
	// x => toAmount
	// x = fromAmount * toAmount / testAmount
	const m = 10000000n
	return  (m + 1n) * fromAmount * toAmount / (testAmount * m)
}