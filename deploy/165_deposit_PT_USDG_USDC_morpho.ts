import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x2412afc9614939a5d994397fe0b94a4f6fb8bc02bfc139e1a5956a865e2efe26", 9970000000n, 8)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-USDG-24SEP-26-USDC-morpho']

/**
 * 101356.465857679640144693 - 10005 * 9 * (1 + 0.035 * 68 / 365) - 10005 = 719 = 40%
 * 160003.935687 - 19940.259936 * 7 * (1 + 0.02 * 37/365) - 19940.259936 = 198 = 10%
 */

