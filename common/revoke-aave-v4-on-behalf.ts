import { Signer } from "ethers"
import { address } from "./types"
import { AAVE_V4_POSITION_MANAGERS } from "./aave-v4/addresses"
import { getReserveId } from "./aave-v4/get-reserve-id"
import { AaveV4Leg } from "./aave-v4/types"
import { IConfigPositionManager__factory, ISpoke__factory, ITakerPositionManager__factory } from "../typechain-types"

export type RevokeOptions = {
	/**
	 * Also drop the spoke-level manager approvals (layer 1).
	 *
	 * Off by default because layer 1 is per (owner, spoke, manager) and shared by every vault the owner
	 * uses on that spoke — revoking it breaks positions this call knows nothing about. Only pass true
	 * when retiring the spoke entirely.
	 */
	positionManagers?: boolean
	/** Revoke even with collateral or debt still outstanding. See the guard below before using. */
	force?: boolean
}

/**
 * Withdraw the authority granted by approveAaveV4OnBehalf.
 *
 * By default this only revokes what was granted to this specific vault (layer 2): the Taker withdraw
 * and borrow allowances per reserve, and the Config collateral permission. That is always safe to run
 * once a position is closed, and is what stops a retired vault keeping unlimited rights over the
 * owner's funds indefinitely.
 */
export async function revokeAaveV4OnBehalf(
	signer: Signer,
	vault: address,
	spoke: address,
	collaterals: AaveV4Leg[],
	debts: AaveV4Leg[],
	{ positionManagers = false, force = false }: RevokeOptions = {},
) {
	const owner = await signer.getAddress()
	const taker = ITakerPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.TAKER, signer)
	const config = IConfigPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.CONFIG, signer)
	const spokeContract = ISpoke__factory.connect(spoke, signer)

	// Revoking mid-position strands it: the vault can no longer withdraw collateral or borrow, so the
	// scripted exit stops working and the position has to be unwound by hand from the owner account.
	const outstanding: string[] = []
	for (const [kind, legs] of [["collateral", collaterals], ["debt", debts]] as const) {
		for (const leg of legs) {
			const reserveId = await getReserveId(signer.provider!, spoke, leg.hub, leg.token)
			const amount = kind === "collateral"
				? await spokeContract.getUserSuppliedAssets(reserveId, owner)
				: await spokeContract.getUserTotalDebt(reserveId, owner)
			if (amount > 0n) {
				outstanding.push(`${kind} reserve ${reserveId}: ${amount}`)
			}
		}
	}
	if (outstanding.length > 0 && !force) {
		throw new Error(
			`Refusing to revoke: the position is still open (${outstanding.join(", ")}). ` +
			`Exit first, or pass force:true and be prepared to unwind manually.`
		)
	}

	let sent = 0

	for (const [kind, legs] of [["withdraw", collaterals], ["borrow", debts]] as const) {
		for (const leg of legs) {
			const reserveId = await getReserveId(signer.provider!, spoke, leg.hub, leg.token)
			const allowance = kind === "withdraw"
				? await taker.withdrawAllowance(spoke, reserveId, owner, vault)
				: await taker.borrowAllowance(spoke, reserveId, owner, vault)
			if (allowance === 0n) {
				continue
			}
			console.log(`Revoking ${kind} allowance on spoke ${spoke} reserve ${reserveId} for vault ${vault}`)
			const tx = kind === "withdraw"
				? await taker.approveWithdraw(spoke, reserveId, vault, 0n)
				: await taker.approveBorrow(spoke, reserveId, vault, 0n)
			await tx.wait()
			sent++
		}
	}

	const permissions = await config.getConfigPermissions(spoke, vault, owner)
	if (permissions.canSetUsingAsCollateral) {
		console.log(`Revoking canSetUsingAsCollateral on spoke ${spoke} from vault ${vault}`)
		await (await config.setCanSetUsingAsCollateralPermission(spoke, vault, false)).wait()
		sent++
	}

	if (positionManagers) {
		for (const [name, manager] of Object.entries(AAVE_V4_POSITION_MANAGERS)) {
			if (!await spokeContract.isPositionManager(owner, manager)) {
				continue
			}
			console.log(`Revoking ${name} position manager ${manager} on spoke ${spoke} (affects every vault)`)
			await (await spokeContract.setUserPositionManager(manager, false)).wait()
			sent++
		}
	}

	console.log(sent === 0 ? "Nothing to revoke" : `Sent ${sent} revocation transaction(s)`)
}
