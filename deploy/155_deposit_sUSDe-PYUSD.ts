import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {deposit} from "../common/deposit";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const collateralVault = "0xdB6165bd1F90cb507F30AbDb42c4596CE4D894f4" as const
	const debtVault = "0xba98fC35C9dfd69178AD5dcE9FA29c64554783b5" as const

	const accountId = 10
	// const from = await getSignerAddress()
	// const vault = await getVaultAddress(hre)
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 29000000000n, 7))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-sUSDe-PYUSD']

