import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDS-USDT-morpho']