# DeFi Automation Platform

## Architecture Decisions
- **No Next.js BFF**: We use direct API calls to external services, not Next.js API routes
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for financial data visualization
- **Hooks**: Logic inside React components should be hidden in hooks. Components should be mostly view

## Contracts

Contracts for different DeFi strategies

Currently mostly support leveraged farming using lending protocols:
- Aave v3
- Aave v4
- Morpho
- Compound

Morpho and Aave v3 flash loans supported (Aave v4 has no flash loans)

### Aave v4

v4 is hub & spoke: hubs hold the liquidity, spokes are the risk layer users interact with
("markets" in the Aave Pro UI). Reserves are keyed by `(spoke, reserveId)`, not by token — a spoke can
list the same token twice when it draws it from two different hubs, so a hub is always required to
resolve a reserve. Ethereum only; arbitrum and plasma stay on v3.

The vault operates positions owned by users, not positions of its own — see below.

Differences that matter when writing a strategy:
- there is no eMode. Supplying does not enable collateral, so `aave-v4-ob-set-collateral` must run once
  before the first borrow (see `deploy/701_setup_PT-USDG-SEP26_USDG_aave_v4.ts`)
- borrow rates carry a per-user risk premium derived from the collateral actually backing the debt
- health factor is per spoke, not protocol-wide
- each spoke has a per-asset supply cap and credit line at the hub, and they bind independently of hub
  liquidity — a hub can be flush while a spoke has no headroom left

To see what is listed where, with remaining headroom:

    TS_NODE_PROJECT=./tsconfig.server.json npx ts-node deploy-test/aave-v4-reserves.ts [SPOKE_NAME]

#### Operating the user's position

`AaveV4OnBehalfStrategy` is the v4 counterpart of `AaveOnBehalfStrategy`, and the only v4 strategy —
there is no vault-owned variant. A spoke rejects a foreign `onBehalfOf`
unless the caller is a governance-activated position manager, so the strategy routes through
the three managers Aave deploys and activates for this: Giver (supply/repay), Taker (withdraw/borrow) and
Config (collateral flag). The vault itself needs no listing — the position owner grants it permission
directly, the same trust model as v3 credit delegation.

Approval comes in two layers and `common/approve-aave-v4-on-behalf.ts` grants both. Layer 1, on the
spoke, authorises each manager contract for that owner:
- `setUserPositionManager(manager, true)` for Giver, Taker and Config

Governance activating a manager is not enough — without the owner's own approval every on-behalf call
reverts with `Unauthorized()`, supply and repay through the Giver included. Layer 2, inside each manager,
authorises this particular vault:
- a withdraw allowance on the Taker per `(spoke, reserveId)` — replaces the v3 aToken approval
- a borrow allowance on the Taker per `(spoke, reserveId)` — replaces v3 credit delegation
- `canSetUsingAsCollateral` on the Config manager, once per spoke

The Giver needs no layer-2 grant: `supplyOnBehalfOf` and `repayOnBehalfOf` have no caller permission.
Note `repayOnBehalfOf` rejects `type(uint256).max`, so the strategy resolves max to the debt read at
execution time; the manager still clamps, so it cannot over-pay.

To check every permission the deposit and withdraw flows need, for the real reserves:

    TS_NODE_PROJECT=./tsconfig.server.json npx ts-node deploy-test/aave-v4-on-behalf-check.ts OWNER VAULT

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
