import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xdf6ca97d41975a6996e9db491cb38152b65d7c00807dfe15d95d8d76e5d122e0", 10005000000n, 10))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDD-AUG26']


// 101356.465857679640144693 - 10005 * 9 * (1 + 0.035 * 68 / 365) - 10005 = 719 = 40%
// 101356.465857679640144693 - 227221.302552 * (1+0.07*33/365)