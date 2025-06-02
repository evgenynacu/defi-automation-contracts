import { address } from "./types"
import { IPool__factory } from "../typechain-types"
import { AAVE_POOL } from "./addresses"
import { type ContractRunner } from "ethers";

export async function getAaveHealthFactor(runner: ContractRunner, wallet: address) {
	const pool = IPool__factory.connect(AAVE_POOL, runner)
	const data = await pool.getUserAccountData(wallet)
	return {
		id: "aave-hf-" + wallet,
		result: Number(1000000n * data.healthFactor / 10n ** 18n) / 1000000,
	}
}