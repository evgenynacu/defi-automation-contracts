import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x21b67f89513da0b0c94af8778134a1ba3f762f944f16208b42cc0663b07eaf05")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-iUSD-morpho']