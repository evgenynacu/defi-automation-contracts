import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { IsUSDS__factory } from '../typechain-types'
import { deployCompound } from "./deploy-compound"
import { deployVault } from "./deploy-or-update-vault"

// Token addresses on Ethereum Mainnet
const S_USDS_ADDRESS = "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD"; // sUSDS token address

// Updated Comet address for USDS
const COMET_USDS_ADDRESS = "0x5D409e56D886231aDAf00c8775665AD0f9897b56"; // USDS Comet

const AAVE_POOL_ADDRESS_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying contracts with account: ${deployer}`);

  // Connect to sUSDS contract to fetch the underlying USDS address
  console.log("Fetching USDS address from sUSDS contract...");
  const sUsdsInterface = IsUSDS__factory.connect(S_USDS_ADDRESS, ethers.provider);
  const USDS_ADDRESS = await sUsdsInterface.asset();
  console.log(`USDS token address: ${USDS_ADDRESS}`);

  // 1. Deploy USdsStrategy
  console.log("Deploying USdsStrategy...");
  const usdsStrategy = await deploy("USdsStrategy", {
    from: deployer,
    args: [USDS_ADDRESS, S_USDS_ADDRESS],
    log: true,
  });
  console.log(`USdsStrategy deployed at: ${usdsStrategy.address}`);

  // 2. Deploy CompoundV3Strategy
  const compoundStrategy = await deployCompound(deployer, deploy, COMET_USDS_ADDRESS, S_USDS_ADDRESS)

  // 3. Deploy AaveFlashLoanStrategy
  console.log("Deploying AaveFlashLoanStrategy...");
  const aaveFlashStrategy = await deploy("AaveFlashLoanStrategy", {
    from: deployer,
    args: [AAVE_POOL_ADDRESS_PROVIDER],
    log: true,
  });
  console.log(`AaveFlashLoanStrategy deployed at: ${aaveFlashStrategy.address}`);

  // 4. Deploy AutomatedVault as a proxy contract
  console.log("Deploying AutomatedVault as proxy...");

  const strategies = [
    usdsStrategy.address,
    compoundStrategy.address,
    aaveFlashStrategy.address
  ];

  await deployVault(hre, deployer, deploy, strategies)

  console.log("Deployment complete!");
};

// Add tags for selective deployment
func.tags = ['deploy-vault', 'deploy-usds-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;