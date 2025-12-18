import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0xdB6165bd1F90cb507F30AbDb42c4596CE4D894f4" as const
	const debtVault = "0xba98fC35C9dfd69178AD5dcE9FA29c64554783b5" as const

	const accountId = 10

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw({ex, lending: euler}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDe-PYUSD']