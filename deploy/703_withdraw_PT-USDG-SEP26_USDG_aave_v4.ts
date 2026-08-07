import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { withdrawFromAaveV4OnBehalf } from "../common/withdraw-from-aave-v4-ob"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { getReserveCapacity } from "../common/aave-v4/get-capacity"
import { PT_USDG_SEP26_USDG } from "../common/aave-v4/positions"

/**
 * Full exit from the PT-USDG-24SEP2026 / USDG position on the USDG Pendle spoke.
 *
 * Flash-loans the outstanding debt, repays it, withdraws all collateral, swaps the collateral back to
 * USDG and sends the remainder to the signer.
 *
 * Two things to know about a 100% exit:
 * - the repay leg is quoted off-chain and the debt keeps accruing, so initWithdraw rounds it up; the
 *   Giver clamps to the real debt, so the over-quote cannot over-pay
 * - the collateral withdraw asks for exactly the quoted balance, so interest accrued since the quote
 *   stays behind as dust. Run again, or retire the reserve, if you need the position at literally zero.
 *
 * Morpho is the default flash-loan source and holds very little USDG — check the pre-flight output
 * below before running, and switch to "insta" if that is deployed on this network.
 */
const FLASH_LOAN_PROVIDER: "morpho" | "insta" = "morpho"

const { spoke: SPOKE, collateral: COLLATERAL, debt: DEBT } = PT_USDG_SEP26_USDG

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)
	const runner = hre.ethers.provider

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
func.tags = ['withdraw-PT-USDG-SEP26-USDG-aave-v4']
