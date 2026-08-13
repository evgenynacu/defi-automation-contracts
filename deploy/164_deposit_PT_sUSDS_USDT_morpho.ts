import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(
		hre,
		ex =>
			depositToMorpho(ex, "0x0367161b7cb23dfd03747dd3815d1c445b0437b648a6d50346249c6e7b92ff1b", 20000000000n, 8)
	)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDS-NOV-26-USDT-morpho']

/**
 * 101356.465857679640144693 - 10005 * 9 * (1 + 0.035 * 68 / 365) - 10005 = 719 = 40%
 * 162092.659235106292814757 - 20000 * 7 * (1 + 0.037 * 104/365) - 20000 = 616 = 10%
 */