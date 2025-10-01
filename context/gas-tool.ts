import {FeeData, Provider} from "ethers";
import {logAsync} from "../common/log-async";

type GasSettings = {
	maxFeePerGas: bigint
	maxPriorityFeePerGas: bigint
} | {
	gasPrice: bigint
} | {

}

export type GasTool = (multiplier?: number) => Promise<GasSettings>
type CacheHolder = {
	cache: Promise<FeeData>
}

export function createGasTool(provider: Provider): GasTool {
	const cacheHolder: CacheHolder = {
		cache: provider.getFeeData()
	}

	setInterval(() => {
		logAsync(fetchAndSaveGasSettings(provider, cacheHolder), "fetchAndSaveGasSettings").then()
	}, 6000)

	return async (multiplier: number = 1.3) => {
		const feeData = await cacheHolder.cache
		return getGasSettings(feeData, multiplier)
	}
}

async function fetchAndSaveGasSettings(provider: Provider, cacheHolder: CacheHolder) {
	const fees = await provider.getFeeData()
	cacheHolder.cache = Promise.resolve(fees)
}

function getGasSettings(feeData: FeeData, multiplier: number = 1.3) {
	if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
		// EIP-1559 поддерживается
		const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * BigInt(Math.floor(multiplier * 100))) / 100n

		return {
			maxFeePerGas: (feeData.maxFeePerGas * BigInt(Math.floor(multiplier * 100))) / 100n,
			maxPriorityFeePerGas: maxBigInt(maxPriorityFeePerGas, 100000000n)
		};
	} else if (feeData.gasPrice) {
		// Fallback к legacy
		return {
			gasPrice: (feeData.gasPrice * BigInt(Math.floor(multiplier * 100))) / 100n
		};
	} else {
		return {}
	}
}

function maxBigInt(a: bigint, b: bigint): bigint {
	return a > b ? a : b;
}
