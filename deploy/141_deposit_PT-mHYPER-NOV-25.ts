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

	const collateralVault = "0xad857E37bCdb3dD0712f5F3267D33ec1085F1a1d" as const
	const debtVault = "0x8aFF4fe319c30475D27eC623D7d44bD5eCFe9616" as const

	const accountId = 3
	// const from = await getSignerAddress()
	// const vault = await getVaultAddress(hre)
	// const owner = xorSubAccountAddress(from, accountId)
	// const evc = await ethers.getContractAt("IEVC2", EVC)
	// await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 15000000000n, 7.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-mHYPER-NOV-25']

//195528.947425 - 24000 * 7 * (1 + 0.1 * 41 / 365) - 24000 = 1641
//113794.161798 - 15000 * 6.5 * (1 + 0.12 * 30 / 365) - 15000 = 332