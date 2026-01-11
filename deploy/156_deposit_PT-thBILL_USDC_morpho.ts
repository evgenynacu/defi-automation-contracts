import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x6c831dcc45a7c0af00b751da651bd874b96653c587615d11aafade7b357c4b43", 27390000000n, 8)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-thBILL-USDC-morpho']

// 13413.387213 - 1658 * 7 * (1 + 0.057 * 43 / 365) - 1658 = 71 = 36%
// 80883.407022 - 10000 * 7 * (1 + 0.057 * 43 / 365) - 10000 = 413 = 35%
// 221444.759248 - 27390 * 7 * (1 + 0.057 * 43 / 365) - 27390 = 1037 = 32%