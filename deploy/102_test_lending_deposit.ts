import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {createSendExecutor, getSignerAddress, getVaultAddress} from "./execute-strategy";
import {Euler} from "../common/lending/euler";
import {MaxUint256} from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)
	const from = await getSignerAddress()
	const vault = await getVaultAddress(hre)

	const ex = await createSendExecutor(hre)
	const lending = new Euler("0x78E3E051D32157AACD550fBB78458762d8f7edFF", "0x37512F45B4ba8808910632323b73783Ca938CD51", 2)
	const d = await lending.initDeposit(ex)

	const res = await ex.execute([
		{
			type: "erc20-transfer-from",
			from,
			token: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
			amount: 1000000000000000n,
		},
		d.getSupplyOperation(1000000000000000n),
		d.getBorrowOperation(1000000n),
		{
			type: "erc20-transfer-to",
			token: d.debt,
			amount: MaxUint256,
			to: from,
		}
	])
	console.log(res)
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['test-lending-deposit']
