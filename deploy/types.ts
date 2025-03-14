import { DeployOptions, DeployResult } from 'hardhat-deploy/types'

export type Deploy = (name: string, options: DeployOptions) => Promise<DeployResult>