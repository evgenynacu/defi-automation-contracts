import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {AaveOnBehalf} from "../common/lending/aave-on-behalf";
import {PT_sUSDe_7MAY2026, USDe_ADDRESS} from "../common/addresses";
import {approveAaveOnBehalf} from "../common/approve-aave-on-behalf";
import {getVaultAddress} from "./execute-strategy";
import {deposit} from "../common/deposit";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const aave = new AaveOnBehalf(PT_sUSDe_7MAY2026, USDe_ADDRESS)
	const [signer] = await hre.ethers.getSigners()
	await approveAaveOnBehalf(signer, await getVaultAddress(hre), [PT_sUSDe_7MAY2026], [USDe_ADDRESS])

	await sendOrEstimate(
		hre,
		ex =>
			deposit(ex, aave, 10000000000000000000000n, 10)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDe-MAY26-USDe-aave']

// 100458.236024509180583186 - 10000 * 9 * (1 + 0.023 * 44 / 365) - 10000 = 208 = 17%
// 100423 - 10000 * 9 * (1 + 0.023 * 42 / 365) - 10000 = 184 = 15.9%
