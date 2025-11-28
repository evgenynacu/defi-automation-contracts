import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x32e253d33f1594a67fc6ef51bf7a39cc4bf2d14904998dee769706fcde489ed9")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 0.1, debtShare: 0.1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-wsrUSD-USDC-morpho']