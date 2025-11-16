import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Euler} from "../common/lending/euler";
import {Morpho} from "../common/lending/morpho";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0x50E6bBa3847357e5ee2Cc55Cc2F5F5E69FdaBE36" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 8

	const euler = new Euler(collateralVault, debtVault, accountId)
	const morpho = new Morpho("0x79b4e55cef9e7c214b5cc965e1984229ada26a66051e35366a75c4d92b776735")
	await sendOrEstimate(hre, ex => withdraw({ex, lending: morpho}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-srUSDe-JAN-26']