import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x29ae8cad946d861464d5e829877245a863a18157c0cde2c3524434dafa34e476", 10008000000n, 10)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-sUSDD-USDT-morpho']

