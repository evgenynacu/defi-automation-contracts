import { ethers, Signer } from "ethers"
import { address } from "./types"
import { AAVE_V4_POSITION_MANAGERS } from "./aave-v4/addresses"
import { getReserveId } from "./aave-v4/get-reserve-id"
import { AaveV4Leg } from "./aave-v4/types"
import { IConfigPositionManager__factory, ISpoke__factory, ITakerPositionManager__factory } from "../typechain-types"

/**
 * Only an exact type(uint256).max counts as granted — a "large enough" threshold is wrong here.
 *
 * The Taker checks the allowance against the raw requested amount before the spoke clamps it, so a
 * MaxUint256 full withdraw needs a literal max allowance. It also decrements any allowance that is not
 * exactly max, so a large finite grant drains as the position is worked and eventually stops covering.
 */
export function isGranted(allowance: bigint) {
	return allowance === ethers.MaxUint256
}

/**
 * Approve an AutomatedVault to manage the signer's Aave v4 position via AaveV4OnBehalfStrategy.
 *
 * v4 has no protocol-level whitelist to clear: the vault acts through Aave's own position managers, and
 * the permissions below are granted by the position owner directly — the same trust model as v3 credit
 * delegation.
 *
 * Approval comes in two layers, and both are required:
 * 1. on the spoke, the owner approves each manager contract (setUserPositionManager). Needed for every
 *    manager, Giver included — supply and repay carry an onBehalfOf and hit the same check.
 * 2. inside each manager, the owner authorises this particular vault, as below.
 *
 * Granted per collateral/debt leg:
 * - withdraw allowance on the Taker, per (spoke, reserveId) — the v4 analogue of the aToken approval
 * - borrow allowance on the Taker, per (spoke, reserveId) — the v4 analogue of credit delegation
 * And once per spoke:
 * - canSetUsingAsCollateral on the Config manager, so the vault can flag collateral before the first borrow
 *
 * Skips anything already granted. Allowances are set to MaxUint256, which also makes a full withdraw
 * possible: the Taker checks the allowance against the raw amount before the spoke clamps it.
 *
 * @param signer       The user whose Aave v4 position will be managed
 * @param vault        The AutomatedVault address that will execute AaveV4OnBehalfStrategy
 * @param spoke        The spoke holding the position
 * @param collaterals  Collateral legs (token + the hub the spoke sources it from)
 * @param debts        Debt legs
 */
export async function approveAaveV4OnBehalf(
	signer: Signer,
	vault: address,
	spoke: address,
	collaterals: AaveV4Leg[],
	debts: AaveV4Leg[],
) {
	const owner = await signer.getAddress()
	const taker = ITakerPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.TAKER, signer)
	const config = IConfigPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.CONFIG, signer)
	const spokeContract = ISpoke__factory.connect(spoke, signer)

	let approvalsSent = 0

	// Layer 1: let each manager act for this owner on this spoke at all. Governance activating a manager
	// is not enough — the spoke's onlyPositionManager check also requires the owner's own approval, and
	// without it every call reverts with Unauthorized(), including supply and repay via the Giver.
	//
	// Listed explicitly rather than iterating the address record: this hands a contract authority over the
	// owner's position, so the set must be exactly what AaveV4OnBehalfStrategy calls, and must not grow
	// silently if another manager address is added to the record later.
	const required = {
		GIVER: AAVE_V4_POSITION_MANAGERS.GIVER,   // supplyOnBehalfOf, repayOnBehalfOf
		TAKER: AAVE_V4_POSITION_MANAGERS.TAKER,   // withdrawOnBehalfOf, borrowOnBehalfOf
		CONFIG: AAVE_V4_POSITION_MANAGERS.CONFIG, // setUsingAsCollateralOnBehalfOf
	}
	for (const [name, manager] of Object.entries(required)) {
		if (await spokeContract.isPositionManager(owner, manager)) {
			continue
		}
		if (!await spokeContract.isPositionManagerActive(manager)) {
			throw new Error(`${name} position manager ${manager} is not active on spoke ${spoke}`)
		}
		console.log(`Approving ${name} position manager ${manager} on spoke ${spoke}`)
		await (await spokeContract.setUserPositionManager(manager, true)).wait()
		approvalsSent++
	}

	for (const leg of collaterals) {
		const reserveId = await getReserveId(signer.provider!, spoke, leg.hub, leg.token)
		const allowance = await taker.withdrawAllowance(spoke, reserveId, owner, vault)
		if (!isGranted(allowance)) {
			console.log(`Approving withdraw on spoke ${spoke} reserve ${reserveId} for vault ${vault}`)
			await (await taker.approveWithdraw(spoke, reserveId, vault, ethers.MaxUint256)).wait()
			approvalsSent++
		}
	}

	for (const leg of debts) {
		const reserveId = await getReserveId(signer.provider!, spoke, leg.hub, leg.token)
		const allowance = await taker.borrowAllowance(spoke, reserveId, owner, vault)
		if (!isGranted(allowance)) {
			console.log(`Approving borrow on spoke ${spoke} reserve ${reserveId} for vault ${vault}`)
			await (await taker.approveBorrow(spoke, reserveId, vault, ethers.MaxUint256)).wait()
			approvalsSent++
		}
	}

	const permissions = await config.getConfigPermissions(spoke, vault, owner)
	if (!permissions.canSetUsingAsCollateral) {
		console.log(`Granting canSetUsingAsCollateral on spoke ${spoke} to vault ${vault}`)
		await (await config.setCanSetUsingAsCollateralPermission(spoke, vault, true)).wait()
		approvalsSent++
	}

	if (approvalsSent === 0) {
		console.log("All approvals already granted, nothing to do")
	} else {
		console.log(`Sent ${approvalsSent} approval transaction(s)`)
	}
}
