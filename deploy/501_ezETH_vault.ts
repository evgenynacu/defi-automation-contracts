import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { deployCompound } from "./deploy-compound"
import { deployVault } from "./deploy-or-update-vault"

const COMET_WETH_ADDRESS = "0xA17581A9E3356d9A858b789D68B4d866e593aE94";

const MORPHO_BLUE = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

const EZETH_ADDRESS = "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110"

const RENZO_ADDRESS = "0x74a09653A083691711cF8215a6ab074BB4e99ef5"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying contracts with account: ${deployer}`);

  // 1. Deploy RenzoStrategy
  console.log("Deploying RenzoStrategy...");
  const renzoStrategy = await deploy("RenzoStrategy", {
    from: deployer,
    args: [WETH_ADDRESS, RENZO_ADDRESS],
    log: true,
  });
  console.log(`RenzoStrategy deployed at: ${renzoStrategy.address}`);

  // 2. Deploy CompoundV3Strategy
  const compoundStrategy = await deployCompound(deployer, deploy, COMET_WETH_ADDRESS, EZETH_ADDRESS)

  // 3. Deploy MorphoFlashLoanStrategy
  console.log("Deploying MorphoFlashLoanStrategy...");
  const morphoFlashStrategy = await deploy("MorphoFlashLoanStrategy", {
    from: deployer,
    args: [MORPHO_BLUE],
    log: true,
  });
  console.log(`MorphoFlashLoanStrategy deployed at: ${morphoFlashStrategy.address}`);

  // 4. Deploy AutomatedVault as a proxy contract
  console.log("Deploying AutomatedVault as proxy...");

  const strategies = [
    renzoStrategy.address,
    compoundStrategy.address,
    morphoFlashStrategy.address
  ];

  await deployVault(hre, deployer, deploy, strategies)

  console.log("Deployment complete!");
};

// Add tags for selective deployment
func.tags = ['deploy-vault', 'deploy-ezeth-vault', 'ethereum-mainnet'];
func.dependencies = []; // No dependencies for this deployment

export default func;