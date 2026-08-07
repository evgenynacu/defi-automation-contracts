// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHubBase} from "./IHubBase.sol";

// @notice Minimal subset of Aave v4 IHub.
// @dev Vendored from aave/aave-v4 (src/hub/interfaces/IHub.sol).
interface IHub is IHubBase {
    // @notice Per (asset, spoke) limits issued by the hub.
    // @dev addCap is the debit line (max the spoke may supply), drawCap the credit line (max it may borrow).
    //      Both are denominated in whole units of the underlying.
    struct SpokeConfig {
        uint40 addCap;
        uint40 drawCap;
        uint24 riskPremiumThreshold;
        bool active;
        bool halted;
    }

    function getSpokeConfig(uint256 assetId, address spoke) external view returns (SpokeConfig memory);
}
