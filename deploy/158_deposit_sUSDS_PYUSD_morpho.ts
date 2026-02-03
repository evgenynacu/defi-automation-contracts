import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0xa5beccdffd156dfe8c0871f143648c512f0a34f37c8a4ae2ff31ebfe944641d1", 9994000000n, 11)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-sUSDS-PYUSD-morpho']

