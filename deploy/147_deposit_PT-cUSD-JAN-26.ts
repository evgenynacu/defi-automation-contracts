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

	const collateralVault = "0xE067311975278b7e7b81Bf57d2a9e58E3eaD75b4" as const
	const debtVault = "0x7c280DBDEf569e96c7919251bD2B0edF0734C5A8" as const

	const accountId = 4
	// const from = await getSignerAddress()
	// const vault = await getVaultAddress(hre)
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 50000000000n, 5.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-cUSD-JAN-26']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//113794.161798 - 15000 * 6.5 * (1 + 0.12 * 30 / 365) - 15000 = 332
//256849.318528008667124480 - 50000 * 4 * (1 + 0.08 * 93 / 365) - 50000 = 2772 = 21.7%
//282514.060368499622889054 - 50000 * 4.5 * (1 + 0.08 * 93 / 365) - 50000 = 2927 = 22.9%