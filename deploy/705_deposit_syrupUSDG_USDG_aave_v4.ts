import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { deposit } from "../common/deposit"
import { AaveV4OnBehalf } from "../common/lending/aave-v4-on-behalf"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { verifyReserveCapacity } from "../common/aave-v4/get-capacity"
import { SYRUP_USDG_USDG } from "../common/aave-v4/positions"
import { pickBorrowLeg } from "../common/aave-v4/pick-debt-leg"
import { FlashLoanProvider } from "../common/flash-loan-provider"

/**
 * Leveraged deposit: puts up USDG, flash-borrows more, swaps the lot into syrupUSDG, supplies it as
 * collateral on the USDG Maple spoke and borrows USDG back to repay the loan.
 *
 * Run 704 first — it grants the vault its permissions and flags the collateral.
 *
 * Flash-loaned from the Uniswap v4 PoolManager. Morpho holds almost no USDG, and v4 charges nothing
 * for taking and settling the same amount inside one unlock.
 *
 * The collateral factor on syrupUSDG is 92%, so the theoretical ceiling is 12.5x. Leave real headroom
 * below that: the health factor is checked at the moment of the borrow, and the swap does not return
 * exactly the quoted amount.
 */
const { spoke: SPOKE, collateral: COLLATERAL } = SYRUP_USDG_USDG

const FLASH_LOAN_PROVIDER: FlashLoanProvider = "uni-v4"

const AMOUNT = 100000n  // USDG put up by the signer, 6 decimals
const LEVERAGE = 5

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const runner = hre.ethers.provider

	// Each hub has its own credit line and they fill independently, so take whichever can still lend.
	const borrowAmount = AMOUNT * BigInt(LEVERAGE - 1)
	const debt = await pickBorrowLeg(runner, SYRUP_USDG_USDG, borrowAmount)

	// The supply cap binds independently of hub liquidity, and busting it reverts inside the flash loan
	// and takes the whole deposit with it. Fail here instead, with the numbers.
	// syrupUSDG is an ERC-4626 over USDG trading slightly above par, so AMOUNT * LEVERAGE USDG buys
	// slightly fewer syrupUSDG. Checking against the USDG figure is therefore conservative.
	const collateralReserveId = await getReserveId(runner, SPOKE, COLLATERAL.hub, COLLATERAL.token)
	await verifyReserveCapacity(runner, SPOKE, collateralReserveId, { supply: AMOUNT * BigInt(LEVERAGE) })

	const aave = new AaveV4OnBehalf(SPOKE, COLLATERAL, debt)

	await sendOrEstimate(hre, ex => deposit(ex, aave, AMOUNT, LEVERAGE, FLASH_LOAN_PROVIDER))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-syrupUSDG-USDG-aave-v4']
