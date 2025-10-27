import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0xA655D6F7550B43B73948fEbdE6cDC7bD201Ba218" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 5

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw({ex, lending: euler}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-alUSD-DEC-25']