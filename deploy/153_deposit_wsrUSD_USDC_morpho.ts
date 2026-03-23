import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x1590cb22d797e226df92ebc6e0153427e207299916e7e4e53461389ad68272fb", 10000000000n, 15)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-wsrUSD-USDC-morpho']

