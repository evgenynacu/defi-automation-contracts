import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0x1590cb22d797e226df92ebc6e0153427e207299916e7e4e53461389ad68272fb")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 1, debtShare: 1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-wsrUSD-USDC-morpho']