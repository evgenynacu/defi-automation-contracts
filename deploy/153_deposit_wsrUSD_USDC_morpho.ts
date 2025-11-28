import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x32e253d33f1594a67fc6ef51bf7a39cc4bf2d14904998dee769706fcde489ed9", 19996000000n, 8)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-wsrUSD-USDC-morpho']

