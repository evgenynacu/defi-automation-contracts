import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0xeb17955ea422baeddbfb0b8d8c9086c5be7a9cfdefb292119a102e981a30062e")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 0.1, debtShare: 0.1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-stcUSD-USDC-morpho']