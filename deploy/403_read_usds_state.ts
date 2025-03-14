import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { readUsdsState } from "./read-usds-state"

const ONE = BigInt(10) ** BigInt(18)

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { usds, compound } = await readUsdsState("0x4ce2B31a7A1974E46a1Ab4b3fa2D480045462374", "0x5D409e56D886231aDAf00c8775665AD0f9897b56")
	console.log("price", usds.price)
	console.log(compound.collateral * usds.price / ONE - compound.debt)
};

// Add tags for selective deployment
func.tags = ['read-vault', 'read-usds-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;