import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { readEzEthState } from "./read-state"

const ONE = BigInt(10) ** BigInt(18)

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { compound } = await readEzEthState("0xEe53FB92669D19c6C9DB2ae7eFbe9fE9521FdE54", "0xA17581A9E3356d9A858b789D68B4d866e593aE94")
	console.log("collateral", compound.collateral, "debt", compound.debt)
};

// Add tags for selective deployment
func.tags = ['read-vault', 'read-ezeth-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;
//34451018153250065238/34451017848165980909