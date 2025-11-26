import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0xbbf7ce1b40d32d3e3048f5cf27eeaa6de8cb27b80194690aab191a63381d8c99")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho, collateralShare: 1, debtShare: 1}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-siUSD-USDC-morpho']