import { type ContractRunner } from "ethers"
import { address } from "../types"
import { IHub__factory, ISpoke__factory } from "../../typechain-types"

/** hub sentinel for "no cap" — MAX_ALLOWED_SPOKE_CAP */
const UNCAPPED = 2n ** 40n - 1n
const MAX = 2n ** 256n - 1n

function ceilDiv(a: bigint, b: bigint) {
	return a === 0n ? 0n : (a - 1n) / b + 1n
}

export type ReserveCapacity = {
	/** Free liquidity of the asset in the hub, shared across every spoke attached to it */
	hubLiquidity: bigint
	/** Per-spoke debit line and how much of it is left, in asset units */
	supplyCap: bigint
	supplyLeft: bigint
	/** Per-spoke credit line and how much of it is left, in asset units */
	borrowCap: bigint
	borrowLeft: bigint
	/** What can actually be borrowed right now: min(borrowLeft, hubLiquidity) */
	borrowable: bigint
}

/**
 * Reads how much a spoke can still supply and borrow for one reserve.
 *
 * Worth checking before a leveraged deposit: the credit line binds independently of hub liquidity, so a
 * hub can hold millions of an asset while the spoke has no headroom left (the USDG Maple spoke sat at
 * 4,999,979 drawn against a 5,000,000 cap with $25M free in the Core hub). A borrow past the cap reverts
 * inside the flash loan and takes the whole deposit down with it.
 */
export async function getReserveCapacity(
	runner: ContractRunner,
	spoke: address,
	reserveId: bigint,
): Promise<ReserveCapacity> {
	const reserve = await ISpoke__factory.connect(spoke, runner).getReserve(reserveId)
	const hub = IHub__factory.connect(reserve.hub, runner)
	const assetId = BigInt(reserve.assetId)

	const [config, added, owed, deficitRay, hubLiquidity] = await Promise.all([
		hub.getSpokeConfig(assetId, spoke),
		hub.getSpokeAddedAssets(assetId, spoke),
		hub.getSpokeTotalOwed(assetId, spoke),
		hub.getSpokeDeficitRay(assetId, spoke),
		hub.getAssetLiquidity(assetId),
	])

	// caps are stored in whole units of the underlying, balances in asset units.
	// type(uint40).max means "uncapped" — the hub skips the check entirely for that value.
	const unit = 10n ** BigInt(reserve.decimals)
	const supplyCap = config.addCap === UNCAPPED ? MAX : config.addCap * unit
	const borrowCap = config.drawCap === UNCAPPED ? MAX : config.drawCap * unit

	// the hub counts written-off debt against the credit line, so it eats into borrow headroom
	const deficit = ceilDiv(deficitRay, 10n ** 27n)
	const drawn = owed + deficit

	const supplyLeft = supplyCap > added ? supplyCap - added : 0n
	const borrowLeft = borrowCap > drawn ? borrowCap - drawn : 0n

	return {
		hubLiquidity,
		supplyCap,
		supplyLeft,
		borrowCap,
		borrowLeft,
		borrowable: borrowLeft < hubLiquidity ? borrowLeft : hubLiquidity,
	}
}

/** Throws with a readable message when a planned supply/borrow would not fit. */
export async function verifyReserveCapacity(
	runner: ContractRunner,
	spoke: address,
	reserveId: bigint,
	{ supply, borrow }: { supply?: bigint, borrow?: bigint },
) {
	const capacity = await getReserveCapacity(runner, spoke, reserveId)

	if (supply !== undefined && supply > capacity.supplyLeft) {
		throw new Error(
			`Supply cap reached on spoke ${spoke} reserve ${reserveId}: ` +
			`want ${supply}, ${capacity.supplyLeft} left of ${capacity.supplyCap}`
		)
	}
	if (borrow !== undefined && borrow > capacity.borrowable) {
		throw new Error(
			`Cannot borrow ${borrow} on spoke ${spoke} reserve ${reserveId}: ` +
			`${capacity.borrowLeft} left on the credit line, ${capacity.hubLiquidity} free in the hub`
		)
	}
	return capacity
}
