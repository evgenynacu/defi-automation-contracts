# DeFi Automation Platform

## Architecture Decisions
- **No Next.js BFF**: We use direct API calls to external services, not Next.js API routes
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for financial data visualization

## Contracts

Contracts for different DeFi strategies

Currently mostly support leveraged farming using lending protocols:
- Aave
- Morpho
- Compound

Morpho and Aave flash loans supported

To use the contracts
1. Deploy NewVaultProxy (deploys only proxy which will be controlled by the wallet)
2. Deposit/Withdraw funds to different strategies

## Wallet configuration
Install frame.sh wallet, set it up.

## How-to deploy the contract
1. npm install
2. 'npx hardhat deploy --network mainnet_universal --tags deploy-new-vault-proxy'. This will deploy proxy contract or update the code and update strategies
3. instead of setting vault in each call you can set it in .env file. Just set VAULT=<vault_address>

## How-to deposit

1. Prepare deposit file for the strategy selected. Basically, you can copy and modify deposit.ts files from other strategies, configure it (choose file based on the lending protocol you want to use)
2. Test deposit using DEBUG_ESTIMATE. VAULT=<vault_address> DEBUG_ESTIMATE=86400 npx hardhat deploy --network mainnet_universal --tags deposit-USD0++-USDC. This will measure output and calculate diff from min to max value so you can see what is the difference if you deposit in different time
3. Deposit. Remove DEBUG_ESTIMATE env var from the command. Later on you will be able to specify minOut which is acceptable for you

## How-to withdraw

1. Prepare withdraw file. Copy and change withdraw file (choose file based on lending protocol used)
2. Choose correct tag, test withdrawal with command: DEBUG_ESTIMATE=86400 VAULT=<vault_address> npx hardhat deploy --network mainnet_universal --tags withdraw-sUSDS-USDT
3. Withdraw with command VAULT=<vault_address> npx hardhat deploy --network mainnet_universal --tags withdraw-sUSDS-USDT

## Configuration env variables

VAULT - overwrite vault address
DEBUG_FROM - overwrite tx sender. txs can't be sent if specified. use just for estimation
DEBUG_CALLDATA - set if you want to check tenderly for specific exchange (odos-v2, enso etc.)
DEBUG_ESTIMATE - time to monitor output for the strategy (in seconds). In the console it will print timestamp and value for future analysis
