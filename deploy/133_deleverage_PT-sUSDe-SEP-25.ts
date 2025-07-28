import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { sendOrEstimate } from "./send-or-estimate"
import { deleverage } from "../common/deleverage"
import { Morpho } from "../common/lending/morpho"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => deleverage(ex, new Morpho("0xc6ae8e71e11ef511acee3f6cc6ad2af67b862877d459e3789905f537c85db5e3"), 0.1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deleverage-PT-sUSDE-SEP-25']
