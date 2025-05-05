import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c", 6499838999n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-cusd0-USDC']

