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

	const collateralVault = "0x0391d9029713B1E9Ee1e241CB53D6BC89bAf299d" as const
	const debtVault = "0xe0a80d35bB6618CBA260120b279d357978c42BCE" as const

	const accountId = 2
	// const from = await getSignerAddress()
	// const vault = await getVaultAddress(hre)
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 29994291854n, 6.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-tUSDe-DEC-25']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//198928.078927900839148922 - 29994 * 5.5 * (1 + 0.069 * 61 / 365) - 29994 = 2064