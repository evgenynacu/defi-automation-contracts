// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// @notice Minimal subset of Aave v4 IHubBase.
// @dev Vendored from aave/aave-v4 (src/hub/interfaces/IHubBase.sol) — no npm package is published for v4.
//      The Hub holds the actual liquidity; Spokes draw from it against per-spoke credit lines.
interface IHubBase {
    // @notice Resolves the hub-local asset id for an underlying token.
    // @dev Reverts if the underlying is not listed on this hub.
    function getAssetId(address underlying) external view returns (uint256);

    // @notice Free (undrawn) liquidity of the asset held by the hub, across all spokes.
    function getAssetLiquidity(uint256 assetId) external view returns (uint256);

    // @notice Amount the given spoke has supplied into the hub for the asset.
    function getSpokeAddedAssets(uint256 assetId, address spoke) external view returns (uint256);

    // @notice Amount the given spoke currently owes the hub for the asset (drawn + premium).
    function getSpokeTotalOwed(uint256 assetId, address spoke) external view returns (uint256);

    // @notice Written-off debt attributed to the spoke, scaled by RAY. Counts against its credit line.
    function getSpokeDeficitRay(uint256 assetId, address spoke) external view returns (uint256);
}
