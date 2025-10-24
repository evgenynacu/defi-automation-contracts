import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0xe1b65304edd8ceaea9b629df4c3c926a37d1216e27900505c04f14b2ed279f33", 15000000000n, 6.5)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-RLP-morpho']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//232105.012840051710326563 - 30000 * 6.5 * (1 + 0.085 * 100 / 365) - 30000 = 2563 = 31%
