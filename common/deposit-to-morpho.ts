import { MorphoBlue, MorphoBlue__factory } from "../typechain-types"
import { StrategyExecutor } from "./calculate-result"
import { address } from "./types"
import { deposit } from "./deposit"
import { Morpho } from "./lending/morpho"
import {getMorphoBlue} from "./get-morpho-blue";

export async function depositToMorpho<T>(
	ex: StrategyExecutor<T>,
	marketId: string,
	amount: bigint,
	leverage: number
): Promise<T> {
	const vaultAddress = await ex.getVaultAddress()
	const { chainId } = await ex.runner.provider!.getNetwork()
	const morpho = MorphoBlue__factory.connect(getMorphoBlue(chainId), ex.runner)

	await verifyVaultAuthorized(await ex.getFrom(), morpho, vaultAddress)

	return deposit(ex, new Morpho(marketId), amount, leverage)
}

export async function verifyVaultAuthorized(from: address, morpho: MorphoBlue, vault: string) {
	if (!(await morpho.isAuthorized(from, vault))) {
		if (process.env.DEBUG_FROM) {
			throw new Error("DEBUG_FROM is set, but vault " + vault + " is not authorized")
		}
		console.log("Enabling vault to manage caller's positions")
		const tx = await morpho.setAuthorization(vault, true)
		await tx.wait()
	}
}