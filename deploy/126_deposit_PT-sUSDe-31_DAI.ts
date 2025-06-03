import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef", 15000000000000000000000n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDe-DAI-JUL']


//203621.444611588985113598 - 200016.834999999999999992 * (1 + 0.06 * 78/365)
//(121430.904167777870993210 - 15000*7 * (1 + 0.0553 * 57 / 365) - 15000) / 15000 * 365 / 57