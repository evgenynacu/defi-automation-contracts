import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xa458018cf1a6e77ebbcc40ba5776ac7990e523b7cc5d0c1e740a4bbc13190d8f", 12005000000000000000000n, 18))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-USDS-AUG']

//(217682.142239198267611368 - 204085.000000000000000000 * (1 + 0.035 * 56/365) - 12005)/12005 * 365/56