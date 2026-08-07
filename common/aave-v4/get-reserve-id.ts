import { type ContractRunner } from "ethers"
import { address } from "../types"
import { IHubBase__factory, ISpoke__factory } from "../../typechain-types"

/**
 * Resolves the reserve id a spoke uses for an underlying token sourced from a given hub.
 *
 * The hub is required, not optional: a spoke can list the same underlying more than once when it draws
 * it from two different hubs (Bluechip lists USDC from both Core and Prime), so those are distinct
 * reserves with distinct rates and liquidity. Scanning a spoke's reserves for a matching underlying
 * would silently pick whichever came first.
 */
export async function getReserveId(
	runner: ContractRunner,
	spoke: address,
	hub: address,
	underlying: address,
): Promise<bigint> {
	const key = `${spoke}-${hub}-${underlying}`.toLowerCase()
	const cached = cache.get(key)
	if (cached !== undefined) {
		return cached
	}

	const assetId = await IHubBase__factory.connect(hub, runner).getAssetId(underlying)
	const reserveId = await ISpoke__factory.connect(spoke, runner).getReserveId(hub, assetId)

	cache.set(key, reserveId)
	return reserveId
}

const cache = new Map<string, bigint>()
