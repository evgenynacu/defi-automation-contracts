import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { readEzEthState } from "./read-state"
import { ethers } from "hardhat"
import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// flash loan ETH
//   repay compound loan
//   withdraw collateral
//   supply collateral as msg.sender
//   borrow as msg.senger
// return flash loan

const COMET_WETH_ADDRESS = "0xA17581A9E3356d9A858b789D68B4d866e593aE94";
const VAULT_ADDRESS = "0xEe53FB92669D19c6C9DB2ae7eFbe9fE9521FdE54"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();

	console.log("Transfering position to " + deployer)

	const { compound } = await readEzEthState(VAULT_ADDRESS, COMET_WETH_ADDRESS)
	console.log("collateral", compound.collateral, "debt", compound.debt)
	const debt = compound.debt * 10000001n / 10000000n
	console.log("flashloan for " + debt)

	const comet = await ethers.getContractAt("IComet", COMET_WETH_ADDRESS)
	if (!(await comet.hasPermission(deployer, VAULT_ADDRESS))) {
		//allowing contract to manage positions
		const tx = await comet.allow(VAULT_ADDRESS, true)
		await tx.wait()
	}
	console.log("already has permission to manage")

	// Strategy indices in the vault
	const RENZO_STRATEGY_INDEX = 0      // RenzoStrategy
	const COMPOUND_STRATEGY_INDEX = 1  // CompoundV3Strategy
	const MORPHO_STRATEGY_INDEX = 2    // MorphoFlashLoanStrategy

	// flash loan
	const vault = await ethers.getContractAt("AutomatedVault", VAULT_ADDRESS)
	const lastRebalanceTimestamp = await vault.lastRebalanceTimestamp()

	const morphoStrategyInterface = (await ethers.getContractFactory("MorphoFlashLoanStrategy")).interface
	const compoundStrategyInterface = (await ethers.getContractFactory("CompoundV3Strategy")).interface
	const innerOperations: HasOperation.OperationStruct[] = []

	innerOperations.push({
		position: COMPOUND_STRATEGY_INDEX,
		callData: compoundStrategyInterface.encodeFunctionData("repayBaseToken", [VAULT_ADDRESS, VAULT_ADDRESS, debt])
	})

	innerOperations.push({
		position: COMPOUND_STRATEGY_INDEX,
		callData: compoundStrategyInterface.encodeFunctionData("withdrawCollateral", [VAULT_ADDRESS, VAULT_ADDRESS, compound.collateral])
	})

	innerOperations.push({
		position: COMPOUND_STRATEGY_INDEX,
		callData: compoundStrategyInterface.encodeFunctionData("supplyCollateral", [VAULT_ADDRESS, deployer, compound.collateral])
	})

	innerOperations.push({
		position: COMPOUND_STRATEGY_INDEX,
		callData: compoundStrategyInterface.encodeFunctionData("borrowBaseToken", [deployer, VAULT_ADDRESS, debt])
	})

	const data = vault.interface.encodeFunctionData("rebalance", [lastRebalanceTimestamp + 1n, 0n, [{
		position: MORPHO_STRATEGY_INDEX,
		callData: morphoStrategyInterface.encodeFunctionData("executeFlashLoan", [WETH_ADDRESS, debt, innerOperations])
	}]])
	console.log("calldata is " + data)
	await vault.rebalance(lastRebalanceTimestamp + 1n, 0n, [{
		position: MORPHO_STRATEGY_INDEX,
		callData: morphoStrategyInterface.encodeFunctionData("executeFlashLoan", [WETH_ADDRESS, debt, innerOperations])
	}])
};

// Add tags for selective deployment
func.tags = ['read-vault', 'transfer-ezeth-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;
