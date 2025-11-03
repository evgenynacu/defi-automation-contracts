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
	const debtVault = "0xe0a80d35bB6618CBA260120b279d357978c42BCE" as const

	const accountId = 7
	const from = await getSignerAddress()
	const vault = await getVaultAddress(hre)
	const owner = xorSubAccountAddress(from, accountId)
	const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 49000000000n, 5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-cUSD-JAN-26-euler']

//228436.426427 - 50000 * 3.5 * (1 + 0.08 * 44 / 365) - 50000 = 1748 = 29%
//456600.700452 - 100000 * 3.5 * (1 + 0.08 * 44 / 365) - 100000 = 3225 = 26.7
//135185.361941 - 29601 * 3.5 * (1 + 0.1 * 42 / 365) - 29601 = 788 = 23%
//5129.199072188300491089 - 1000 * 4 * (1 + 0.08 * 86 / 365) - 1000 = 53 = 23%
//251209.892472065541381497 - 49000 * 4 * (1 + 0.08 * 86 / 365) - 49000 = 2515 / 86 * 365 = 22%