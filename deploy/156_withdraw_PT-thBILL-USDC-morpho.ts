import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x6c831dcc45a7c0af00b751da651bd874b96653c587615d11aafade7b357c4b43")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-thBILL-USDC-morpho']