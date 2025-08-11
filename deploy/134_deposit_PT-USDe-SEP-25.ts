import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xb0a9ac81a8c6a5274aa1a8337aed35a2cb2cd4feb5c6d3b39d41f234fbf2955b", 73524000000n, 7.8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-USDe-SEP-25']

//506339.657930874253551573 - 63933 * 6.8 * (1 + 0.08 * 50 / 365) - 63933
//582706.557663165480366006 - 73524 * 6.8 * (1 + 0.08 * 50 / 365) - 73524