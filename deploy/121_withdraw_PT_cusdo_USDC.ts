import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-cusd0-USDC']