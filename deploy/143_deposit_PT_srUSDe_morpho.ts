import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x79b4e55cef9e7c214b5cc965e1984229ada26a66051e35366a75c4d92b776735", 30000000000n, 7.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-srUSDe-morpho']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//230737.024234135989552205 - 30000 * 6.5 * (1 + 0.08 * 86 / 365) - 30000 = 2061 = 29%