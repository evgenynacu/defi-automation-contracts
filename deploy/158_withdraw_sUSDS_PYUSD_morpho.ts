import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0xa5beccdffd156dfe8c0871f143648c512f0a34f37c8a4ae2ff31ebfe944641d1")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 1, debtShare: 1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDS-PYUSD-morpho']