import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0xE067311975278b7e7b81Bf57d2a9e58E3eaD75b4" as const
	const debtVault = "0xe0a80d35bB6618CBA260120b279d357978c42BCE" as const

	const accountId = 7

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw({ex, lending: euler}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-cUSD-JAN-26-euler']