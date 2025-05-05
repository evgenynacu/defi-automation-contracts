import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0x8b1bc4d682b04a16309a8adf77b35de0c42063a7944016cfc37a79ccac0007b6", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-slvlUSD-USDC']