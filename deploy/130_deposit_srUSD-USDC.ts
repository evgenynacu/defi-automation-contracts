import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac", 10003352335n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-srUSD-USDC']
