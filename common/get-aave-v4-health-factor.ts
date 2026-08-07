import { address } from "./types"
import { ISpoke__factory } from "../typechain-types"
import { type ContractRunner } from "ethers"

/**
 * Health factor of a position on one Aave v4 spoke.
 *
 * Unlike v3 there is no protocol-wide health factor: collateral on one spoke does not back debt on
 * another, so this is always scoped to a single spoke.
 */
export async function getAaveV4HealthFactor(runner: ContractRunner, spoke: address, wallet: address) {
	const data = await ISpoke__factory.connect(spoke, runner).getUserAccountData(wallet)
	return {
		id: `aave-v4-hf-${spoke}-${wallet}`,
		// healthFactor is WAD; with no debt the spoke returns type(uint256).max
		result: data.healthFactor > MAX_REPORTED_HF
			? Infinity
			: Number(1000000n * data.healthFactor / 10n ** 18n) / 1000000,
	}
}

const MAX_REPORTED_HF = 10n ** 36n
