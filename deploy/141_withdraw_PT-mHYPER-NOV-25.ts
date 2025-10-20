import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0xad857E37bCdb3dD0712f5F3267D33ec1085F1a1d" as const
	const debtVault = "0x8aFF4fe319c30475D27eC623D7d44bD5eCFe9616" as const

	const accountId = 3

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw({ex, lending: euler}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-mHYPER-NOV-25']