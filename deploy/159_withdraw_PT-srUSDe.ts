import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {withdrawFromAave} from "../common/withdraw-from-aave"
import {PT_srUSDE_2APR2026, sUSDe_ADDRESS, USDC, USDe_ADDRESS} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {AaveOnBehalf} from "../common/lending/aave-on-behalf";
import {withdraw} from "../common/withdraw";
import {approveAaveOnBehalf} from "../common/approve-aave-on-behalf";
import {getVaultAddress} from "./execute-strategy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const aave = new AaveOnBehalf(PT_srUSDE_2APR2026, USDe_ADDRESS)
	const [signer] = await hre.ethers.getSigners()
	await approveAaveOnBehalf(signer, await getVaultAddress(hre), [PT_srUSDE_2APR2026], [USDe_ADDRESS])
	await sendOrEstimate(hre, ex => withdraw({ex, lending: aave, collateralShare: 1, debtShare: 1}))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-srUSDe-APR26-USDe-AAVE-personal']