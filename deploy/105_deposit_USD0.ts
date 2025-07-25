import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 2004010138835419948249n, 6.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0-curve']