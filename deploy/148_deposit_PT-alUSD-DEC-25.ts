import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {depositToMorpho} from "../common/deposit-to-morpho";
import {deposit} from "../common/deposit";
import {Euler, xorSubAccountAddress} from "../common/lending/euler";
import {ethers} from "hardhat";
import {EVC} from "../common/addresses";
import {getSignerAddress, getVaultAddress} from "./execute-strategy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const collateralVault = "0xA655D6F7550B43B73948fEbdE6cDC7bD201Ba218" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 5
	// const from = await getSignerAddress()
	// const vault = await getVaultAddress(hre)
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 29601000000n, 4.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-alUSD-DEC-25']

//228436.426427 - 50000 * 3.5 * (1 + 0.08 * 44 / 365) - 50000 = 1748 = 29%
//456600.700452 - 100000 * 3.5 * (1 + 0.08 * 44 / 365) - 100000 = 3225 = 26.7
//135185.361941 - 29601 * 3.5 * (1 + 0.1 * 42 / 365) - 29601 = 788 = 23%