import {IPoolDataProvider, IPoolDataProvider__factory} from "../typechain-types";
import {address, toAddress} from "../common/types";
import {aaveReserveCapGauge, aaveTotalSuppliedGauge} from "./metrics";
import {tokens} from "../context/tokens";
import {ContractRunner} from "ethers";

const POOL_DATA_PROVIDER = "0x41393e5e337606dc3821075Af65AeE84D7688CBD"

export async function exportAaveMetrics(ethRunner: ContractRunner) {
	if (process.env.AAVE_TOKENS) {
		const tokens = process.env.AAVE_TOKENS.split(",").map(toAddress)
		const poolDataProvider = IPoolDataProvider__factory.connect(POOL_DATA_PROVIDER, ethRunner)
		for (let i = 0; i < tokens.length; i++) {
			await exportTokenCapAndTotalSupply(poolDataProvider, tokens[i])
		}
	}
}

async function exportTokenCapAndTotalSupply(dataProvider: IPoolDataProvider, token: address) {
	const { totalSupply, supplyCap } = await fetchMetrics(dataProvider, token)
	aaveReserveCapGauge.set({ token: tokens[token] || token }, supplyCap)
	aaveTotalSuppliedGauge.set({ token: tokens[token] || token }, totalSupply)
}

async function fetchMetrics(dataProvider: IPoolDataProvider, token: address) {
	const [, supplyCap] = await dataProvider.getReserveCaps(token)
	if (supplyCap === 0n) {
		return {
			supplyCap: 0,
			totalSupply: 0,
		}
	}
	const totalSupply = await dataProvider.getATokenTotalSupply(token)
	return {
		supplyCap: Number(supplyCap),
		totalSupply: Number(totalSupply),
	}
}