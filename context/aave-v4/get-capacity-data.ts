import { type ContractRunner } from "ethers"
import { getReserveId } from "../../common/aave-v4/get-reserve-id"
import { getReserveCapacity, toWholeUnits } from "../../common/aave-v4/get-capacity"
import { AaveV4CapacityRequest } from "../service/data-service"

/**
 * Resolves the reserve behind a (spoke, hub, token) and reports its remaining room, in whole units.
 *
 * `result` is the supply headroom, since that is what decides whether a position can be opened at all —
 * the caps bind independently of hub liquidity, and syrupUSDG on the USDG Maple spoke went from 1.59M
 * free to zero within hours.
 */
export async function getAaveV4Capacity(runner: ContractRunner, request: AaveV4CapacityRequest) {
	const reserveId = await getReserveId(runner, request.spoke, request.hub, request.token)
	const capacity = await getReserveCapacity(runner, request.spoke, reserveId)
	const { decimals } = capacity

	return {
		id: `aave-v4-capacity-${request.spoke}-${request.token}`,
		reserveId: Number(reserveId),
		result: toWholeUnits(capacity.supplyLeft, decimals),
		supplyCap: toWholeUnits(capacity.supplyCap, decimals),
		borrowable: toWholeUnits(capacity.borrowable, decimals),
		borrowLeft: toWholeUnits(capacity.borrowLeft, decimals),
		hubLiquidity: toWholeUnits(capacity.hubLiquidity, decimals),
	}
}
