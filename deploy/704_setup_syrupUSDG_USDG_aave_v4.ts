import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { getVaultAddress } from "./execute-strategy"
import { AaveV4OnBehalf } from "../common/lending/aave-v4-on-behalf"
import { approveAaveV4OnBehalf } from "../common/approve-aave-v4-on-behalf"
import { getReserveCapacity } from "../common/aave-v4/get-capacity"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { SYRUP_USDG_USDG } from "../common/aave-v4/positions"

/**
 * One-time setup for the syrupUSDG / USDG position on the USDG Maple spoke.
 *
 * Grants the vault both approval layers on the owner's behalf and flags syrupUSDG as collateral.
 * Aave v4 supply() does not enable collateral, so without this the first borrow reverts on health
 * factor — and inside a leveraged deposit that takes the whole flash loan with it.
 */
const { spoke: SPOKE, collateral: COLLATERAL, debt: DEBT } = SYRUP_USDG_USDG

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const [signer] = await hre.ethers.getSigners()
	const vault = await getVaultAddress(hre)
	const runner = hre.ethers.provider

	await approveAaveV4OnBehalf(signer, vault, SPOKE, [COLLATERAL], [DEBT])

	for (const [name, leg] of [["collateral", COLLATERAL], ["debt", DEBT]] as const) {
		const reserveId = await getReserveId(runner, SPOKE, leg.hub, leg.token)
		const capacity = await getReserveCapacity(runner, SPOKE, reserveId)
		console.log(
			`${name} reserve ${reserveId}: supply left ${capacity.supplyLeft}, ` +
			`borrowable ${capacity.borrowable} (credit left ${capacity.borrowLeft}, hub free ${capacity.hubLiquidity})`
		)
	}

	const aave = new AaveV4OnBehalf(SPOKE, COLLATERAL, DEBT)
	await sendOrEstimate(hre, async ex => ex.execute(await aave.initCollateralOperations(ex)))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['setup-syrupUSDG-USDG-aave-v4']
