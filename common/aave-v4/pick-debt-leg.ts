import { type ContractRunner } from "ethers"
import { address } from "../types"
import { AaveV4Leg } from "./types"
import { AaveV4Position } from "./positions"
import { getReserveId } from "./get-reserve-id"
import { getReserveCapacity } from "./get-capacity"
import { getHubName, getSpokeName } from "./addresses"
import { ISpoke__factory } from "../../typechain-types"

/** Every hub the debt token can be drawn from on this spoke, preferred first. */
export function debtLegs(position: AaveV4Position): AaveV4Leg[] {
	return [
		position.debt,
		...(position.fallbackDebtHubs ?? []).map(hub => ({ token: position.debt.token, hub })),
	]
}

/**
 * Picks a hub to borrow from, preferring the position's primary and falling back to the alternatives.
 *
 * A spoke can list the same token once per hub, each with its own credit line, and those fill up
 * independently — the Core hub's USDG line has gone from millions to zero and back more than once.
 * Choosing at execution time keeps a deposit working when the usual hub is capped.
 */
export async function pickBorrowLeg(
	runner: ContractRunner,
	position: AaveV4Position,
	amount: bigint,
): Promise<AaveV4Leg> {
	const tried: string[] = []

	for (const leg of debtLegs(position)) {
		const reserveId = await getReserveId(runner, position.spoke, leg.hub, leg.token)
		const capacity = await getReserveCapacity(runner, position.spoke, reserveId)
		if (capacity.borrowable >= amount) {
			console.log(`borrowing from hub ${getHubName(leg.hub)} (reserve ${reserveId}), ${capacity.borrowable} available`)
			return leg
		}
		tried.push(
			`${getHubName(leg.hub)} reserve ${reserveId}: ${capacity.borrowable} borrowable ` +
			`(credit left ${capacity.borrowLeft}, hub free ${capacity.hubLiquidity})`
		)
	}

	throw new Error(
		`No hub on spoke ${getSpokeName(position.spoke)} can lend ${amount} of ${position.debt.token}. Tried — ${tried.join("; ")}`
	)
}

/**
 * Finds where the debt actually sits, for repayment.
 *
 * Deliberately not the same question as pickBorrowLeg: repayment has to target the reserve the debt was
 * drawn from, not whichever one currently has room. Getting this wrong would repay nothing and leave
 * the position open.
 */
export async function findDebtLeg(
	runner: ContractRunner,
	position: AaveV4Position,
	owner: address,
): Promise<AaveV4Leg> {
	const withDebt: { leg: AaveV4Leg, reserveId: bigint, debt: bigint }[] = []

	for (const leg of debtLegs(position)) {
		const reserveId = await getReserveId(runner, position.spoke, leg.hub, leg.token)
		const debt = await ISpoke__factory.connect(position.spoke, runner).getUserTotalDebt(reserveId, owner)
		if (debt > 0n) {
			withDebt.push({ leg, reserveId, debt })
		}
	}

	if (withDebt.length === 0) {
		throw new Error(`No outstanding debt for ${owner} on spoke ${getSpokeName(position.spoke)}`)
	}
	if (withDebt.length > 1) {
		// One withdraw repays one reserve, so a position split across hubs needs one run per hub.
		const parts = withDebt.map(d => `${getHubName(d.leg.hub)} reserve ${d.reserveId}: ${d.debt}`).join("; ")
		console.warn(`Debt is spread across ${withDebt.length} hubs — ${parts}. Repaying the largest; run again for the rest.`)
		withDebt.sort((a, b) => (b.debt > a.debt ? 1 : -1))
	}

	const chosen = withDebt[0]
	console.log(`repaying hub ${getHubName(chosen.leg.hub)} (reserve ${chosen.reserveId}), debt ${chosen.debt}`)
	return chosen.leg
}
