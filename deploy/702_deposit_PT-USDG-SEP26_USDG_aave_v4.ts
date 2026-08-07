import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { deposit } from "../common/deposit"
import { AaveV4OnBehalf } from "../common/lending/aave-v4-on-behalf"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { verifyReserveCapacity } from "../common/aave-v4/get-capacity"
import { PT_USDG_SEP26_USDG } from "../common/aave-v4/positions"
import { FlashLoanProvider } from "../common/flash-loan-provider"

/**
 * Leveraged deposit into PT-USDG-24SEP2026 collateral against USDG debt, on the USDG Pendle spoke.
 * Debt is drawn from the Core hub; collateral is supplied into the Global Dollar hub.
 *
 * Run 701 first — it grants the vault its permissions and flags the collateral, without which the
 * borrow leg reverts inside the flash loan.
 */
// Morpho holds almost no USDG; the v4 PoolManager holds millions and charges nothing.
const FLASH_LOAN_PROVIDER: FlashLoanProvider = "uni-v4"

const AMOUNT = 1_000000n
const LEVERAGE = 10

const { spoke: SPOKE, collateral: COLLATERAL, debt: DEBT } = PT_USDG_SEP26_USDG

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const runner = hre.ethers.provider

	// Both caps bind independently of hub liquidity, and busting either reverts inside the flash loan and
	// takes the whole deposit with it. Fail here instead, with the numbers.
	const [collateralReserveId, debtReserveId] = await Promise.all([
		getReserveId(runner, SPOKE, COLLATERAL.hub, COLLATERAL.token),
		getReserveId(runner, SPOKE, DEBT.hub, DEBT.token),
	])

	// PT trades below USDG until maturity, so AMOUNT * LEVERAGE understates the token count the swap
	// will produce. Treat this as a floor on the supply headroom needed, not an exact figure.
	await verifyReserveCapacity(runner, SPOKE, collateralReserveId, { supply: AMOUNT * BigInt(LEVERAGE) })
	await verifyReserveCapacity(runner, SPOKE, debtReserveId, { borrow: AMOUNT * BigInt(LEVERAGE - 1) })

	const aave = new AaveV4OnBehalf(SPOKE, COLLATERAL, DEBT)

	await sendOrEstimate(hre, ex => deposit(ex, aave, AMOUNT, LEVERAGE, FLASH_LOAN_PROVIDER))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-USDG-SEP26-USDG-aave-v4']
