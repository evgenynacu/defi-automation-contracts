// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// @notice Minimal subset of Aave v4 ISpoke.
// @dev Vendored from aave/aave-v4 (src/spoke/interfaces/ISpoke.sol) — no npm package is published for v4.
//      A Spoke is the risk layer users interact with; it holds no tokens and routes everything to a Hub.
//      Reserves are keyed by reserveId, not by token: one spoke can list the same underlying twice when it
//      sources it from two different hubs, so (spoke, token) is not a unique key.
interface ISpoke {
    // @dev Field order matches upstream. `flags` is a ReserveFlags user-defined value type over uint8 upstream,
    //      which is ABI-identical to uint8, and `hub` is typed IHubBase upstream (ABI-identical to address).
    struct Reserve {
        address underlying;
        address hub;
        uint16 assetId;
        uint8 decimals;
        uint24 collateralRisk;
        uint8 flags;
        uint32 dynamicConfigKey;
    }

    // @dev healthFactor is expressed in WAD (1e18 == 1.00), and is scoped to this spoke only.
    struct UserAccountData {
        uint256 riskPremium;
        uint256 avgCollateralFactor;
        uint256 healthFactor;
        uint256 totalCollateralValue;
        uint256 totalDebtValueRay;
        uint256 activeCollateralCount;
        uint256 borrowCount;
    }

    // @dev Only views are declared here. Every state change goes through a position manager
    //      (see IPositionManagers.sol) because the vault operates positions it does not own, and a spoke
    //      rejects a foreign onBehalfOf from anyone that is not an activated manager.

    function getReserve(uint256 reserveId) external view returns (Reserve memory);

    function getReserveId(address hub, uint256 assetId) external view returns (uint256);

    function getReserveCount() external view returns (uint256);

    function getUserSuppliedAssets(uint256 reserveId, address user) external view returns (uint256);

    function getUserTotalDebt(uint256 reserveId, address user) external view returns (uint256);

    // @return usingAsCollateral, borrowing
    function getUserReserveStatus(uint256 reserveId, address user) external view returns (bool, bool);

    function getUserAccountData(address user) external view returns (UserAccountData memory);

    // @notice True if the position manager has been activated on this spoke by governance.
    function isPositionManagerActive(address positionManager) external view returns (bool);

    // @notice True if the manager may act for the user: either it is the user, or it is active AND the
    //         user approved it via setUserPositionManager. Governance activation alone is not enough.
    function isPositionManager(address user, address positionManager) external view returns (bool);

    // @notice Called by the position owner to let a manager act on their positions on this spoke.
    // @dev Required for every manager, including the Giver — supply/repay carry an onBehalfOf too.
    function setUserPositionManager(address positionManager, bool approve) external;
}
