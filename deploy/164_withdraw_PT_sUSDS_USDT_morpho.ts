import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x0367161b7cb23dfd03747dd3815d1c445b0437b648a6d50346249c6e7b92ff1b")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 1, debtShare: 1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-sUSDS-NOV-26-USDT-morpho']