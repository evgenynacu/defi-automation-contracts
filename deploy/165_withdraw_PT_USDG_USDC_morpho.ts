import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x2412afc9614939a5d994397fe0b94a4f6fb8bc02bfc139e1a5956a865e2efe26")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 1, debtShare: 1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-USDG-24SEP-26-USDC-morpho']