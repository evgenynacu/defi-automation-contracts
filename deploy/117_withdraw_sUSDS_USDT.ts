import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDS-USDT']