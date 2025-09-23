import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {Euler} from "../common/lending/euler";
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const morpho = new Morpho("0xd3146eb281fff405b3fe418723899a890cb2f29646160a07af81ca241e2ec96e")
	await sendOrEstimate(hre, ex => withdraw(ex, morpho, 0.01))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-mMEV-OCT-25']