import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x96a4399f2c837f8aa34c39718e30625a84f9285991f0a08d1f2997e15bbeeaa8", 8196170160n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-syrupUSDC-AUG']

//(66530.506733 - 57373.191120 * (1 + 0.05 * 62 / 365) - 8196.170160) / 8196.170160 * 365 / 62