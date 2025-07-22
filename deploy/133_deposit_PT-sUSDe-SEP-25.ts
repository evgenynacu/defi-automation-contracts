import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xc6ae8e71e11ef511acee3f6cc6ad2af67b862877d459e3789905f537c85db5e3", 36560000000000000000000n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDE-SEP-25']

//487889.773086385030559662 - 60000 * 7 * (1 + 0.06 * 68 / 365) - 60000
//297956.470113315753025986 - 36560 * 7 * (1 + 0.06 * 68 / 365) - 36560