import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { MORPHO_BLUE, PT_sUSDe_JUL, PT_sUSDe_SEP, usdc, USDT_ADDRESS } from "../common/addresses"
import { verifyVaultAuthorized } from "../common/deposit-to-morpho"
import { ethers } from "hardhat"
import { MorphoBlue } from "../typechain-types"
import { getSignerAddress, getVaultAddress } from "./execute-strategy"
import { sendOrEstimate } from "./send-or-estimate"
import { refinance } from "../common/refinance"
import { Morpho } from "../common/lending/morpho"
import { Aave } from "../common/lending/aave"
import { MaxUint256 } from "ethers"
import { calculateAmountToSwap } from "../common/calculate-amount-to-swap"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const morphoBlue: MorphoBlue = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const vault = await getVaultAddress(hre, "AaveUsdcVaultProxy")
	const from = await getSignerAddress()
	await verifyVaultAuthorized(from, morphoBlue, vault)

	const aaveUsdt = new Aave(PT_sUSDe_SEP, USDT_ADDRESS)
	const aaveUsdc = new Aave(PT_sUSDe_SEP, usdc)
	await sendOrEstimate(hre, async ex => {
		const m = 100000n
		const debtToRepay = 386450000000n
		const newDebtAmount = (await calculateAmountToSwap(USDT_ADDRESS, usdc, debtToRepay)) * (m + 1n) / m
		console.log("newDebtAmount", newDebtAmount, "debtToRepay", debtToRepay)

		const usdcWithdraw = await aaveUsdc.initWithdraw(ex, 1)
		const usdtDeposit = await aaveUsdt.initDeposit(ex)
		return ex.execute([
			{
				type: "morpho-flash-loan",
				token: usdc,
				amount: debtToRepay,
				innerOperations: [
					usdcWithdraw.repayOperation,
					usdtDeposit.getBorrowOperation(newDebtAmount),
					{
						type: "swap",
						from: USDT_ADDRESS,
						to: usdc,
						amount: newDebtAmount
					},
				]
			},
			{
				type: "erc20-transfer-to-caller",
				token: usdc,
				amount: MaxUint256
			}
		])
	}, "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-sUSDe-SEP-25-AAVE']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)

//0x0000000000000000000000000000000000000000000000000000000000000036
//0x0000000000000000000000000000000000000000043b2dce4b4fb04127bbce3b

//0xc00262ed55c3f8b3ae06bbb28c20fbb0e54ee84605c5c00c4ce60d963f62f80b
//0x00000000043b2dce4b4fb04127bbce3b00000000000000000000000000000000

