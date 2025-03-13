import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { depositIntoStrategy } from "./leveraged_deposit_into_strategy"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployer] = await ethers.getSigners();

  console.log("Depositing funds using", deployer.address)
  await depositIntoStrategy(10000508156966713344n, 8, "0x4ce2B31a7A1974E46a1Ab4b3fa2D480045462374", deployer)
};

// Add tags for selective deployment
func.tags = ['deposit-into-vault', 'deposit-into-usds-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;