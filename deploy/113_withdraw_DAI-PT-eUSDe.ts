import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-DAI-PT-eUSDe']