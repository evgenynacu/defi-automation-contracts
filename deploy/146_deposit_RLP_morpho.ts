import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0xe1b65304edd8ceaea9b629df4c3c926a37d1216e27900505c04f14b2ed279f33", 24370000000n, 6.5)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-RLP-morpho']

