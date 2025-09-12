import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x8cdb63a27a48ac27fadc0f158a732104bcc4e10bb61c9a5095ea7c127204e26c", 32026000000000000000013n, 7.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-USDE-NOV-25']

//244334.030261107145318020 - 32000 * 6.5 * (1 + 0.06 * 75 / 365) - 32000 = 1776