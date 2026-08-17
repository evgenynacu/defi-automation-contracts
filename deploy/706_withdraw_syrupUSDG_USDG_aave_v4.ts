import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { withdrawFromAaveV4OnBehalf } from "../common/withdraw-from-aave-v4-ob"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { getReserveCapacity } from "../common/aave-v4/get-capacity"
import { SYRUP_USDG_USDG } from "../common/aave-v4/positions"
import { findDebtLeg } from "../common/aave-v4/pick-debt-leg"
import { FlashLoanProvider } from "../common/flash-loan-provider"
import { toAddress } from "../common/types"

/**
 * Full exit from the syrupUSDG / USDG position: flash-borrows the debt, repays it, withdraws all
 * collateral, swaps syrupUSDG back to USDG and sends the remainder to the signer.
 *
 * A 100% exit leaves dust behind — the collateral withdraw asks for exactly the quoted balance, so
 * yield accrued since the quote stays in the position. Run again if you need it at literally zero.
 */
const { spoke: SPOKE, collateral: COLLATERAL } = SYRUP_USDG_USDG

const FLASH_LOAN_PROVIDER: FlashLoanProvider = "uni-v4"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)
	const runner = hre.ethers.provider

	// Repay the reserve the debt was drawn from, which is not necessarily the one with room now.
	const [signer] = await hre.ethers.getSigners()
	const DEBT = await findDebtLeg(runner, SYRUP_USDG_USDG, toAddress(await signer.getAddress()))

	// The hub pays the withdrawal out of its own liquidity, so a full exit can revert even when the
	// position is solvent. Report both sides before attempting it.
	const [collateralReserveId, debtReserveId] = await Promise.all([
		getReserveId(runner, SPOKE, COLLATERAL.hub, COLLATERAL.token),
		getReserveId(runner, SPOKE, DEBT.hub, DEBT.token),
	])
	const [collateralCapacity, debtCapacity] = await Promise.all([
		getReserveCapacity(runner, SPOKE, collateralReserveId),
		getReserveCapacity(runner, SPOKE, debtReserveId),
	])
	console.log(`collateral reserve ${collateralReserveId}: hub liquidity ${collateralCapacity.hubLiquidity}`)
	console.log(`debt reserve ${debtReserveId}: hub liquidity ${debtCapacity.hubLiquidity}`)

	await sendOrEstimate(hre, ex => withdrawFromAaveV4OnBehalf(ex, SPOKE, COLLATERAL, DEBT, {
		debtShare: 1,
		collateralShare: 1,
		flashLoanProvider: FLASH_LOAN_PROVIDER,
	}))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-syrupUSDG-USDG-aave-v4']
