import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {Euler, xorSubAccountAddress} from "../common/lending/euler";
import {deposit} from "../common/deposit";
import {getSignerAddress, getVaultAddress} from "./execute-strategy";
import {EVC} from "../common/addresses";
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const accountId = 1
	const collateralVault = "0xCfC6a55Aa72DCF3755A515aE8B82552028b63D2A"
	const debtVault = "0x53AfE3343f322c4189Ab69E0D048efd154259419";

	const from = await getSignerAddress()
	const vault = await getVaultAddress(hre)
	const owner = xorSubAccountAddress(from, accountId)

	const evc = await ethers.getContractAt("IEVC2", EVC)
	//await evc.setAccountOperator(owner, vault, true)
	// await evc.enableCollateral(owner, collateralVault)
	// await evc.enableController(owner, debtVault)

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => deposit(ex, euler, 20000000000n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-pUSDE-OCT-25']

//161604.606488534743330997 - 20000 * 7 * (1 + 0.1 * 28 / 365) - 20000 = 530