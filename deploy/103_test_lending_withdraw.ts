import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {createSendExecutor, getSignerAddress, getVaultAddress} from "./execute-strategy";
import {verifyAllowance} from "../common/verify-allowance";
import {Euler} from "../common/lending/euler";
import {MaxUint256} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const from = await getSignerAddress()
	const vault = await getVaultAddress(hre)

	const ex = await createSendExecutor(hre)
	const lending = new Euler("0x78E3E051D32157AACD550fBB78458762d8f7edFF", "0x37512F45B4ba8808910632323b73783Ca938CD51", 2)
	const withdraw = await lending.initWithdraw(ex, 1, 1)

	await verifyAllowance(ex.runner, withdraw.debt, withdraw.debtToRepay, vault)
	console.log(await withdraw.getHealthFactor())

	const res = await ex.execute([
		{
			type: "erc20-transfer-from",
			from,
			token: withdraw.debt,
			amount: withdraw.debtToRepay,
		},
		withdraw.repayOperation,
		withdraw.getWithdrawOperation(withdraw.collateralToWithdraw),
		{
			type: "erc20-transfer-to",
			token: withdraw.collateral,
			amount: MaxUint256,
			to: from,
		},
		{
			type: "erc20-transfer-to",
			token: withdraw.debt,
			amount: MaxUint256,
			to: from,
		}
	])

	console.log(res)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['test-lending-withdraw']
