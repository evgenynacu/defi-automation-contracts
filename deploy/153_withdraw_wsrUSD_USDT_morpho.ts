import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0xa9f70093360419b4544f17a4553ac5847d896be23f020295bd95c24af4df700e")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 0.1, debtShare: 0.1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-wsrUSD-USDT-morpho']