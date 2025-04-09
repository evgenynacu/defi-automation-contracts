import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-USD0-curve']