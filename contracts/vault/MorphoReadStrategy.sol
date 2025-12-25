// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../morpho/MorphoBlue.sol";
import "../morpho/MorphoBlue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MorphoReadStrategy {
    using SafeERC20 for IERC20;

    // Morpho contract address
    MorphoBlue public immutable MORPHO;

    /**
     * @notice Constructor for the strategy
     * @param _morphoAddress The Morpho contract address
     */
    constructor(address _morphoAddress) {
        require(_morphoAddress != address(0), "Invalid Morpho address");
        MORPHO = MorphoBlue(_morphoAddress);
    }

    function getMarketTotalBorrowAssets(bytes32 marketId) external returns (uint) {
        MorphoBlue.MarketParams memory params = MORPHO.idToMarketParams(marketId);
        uint balance = IERC20(params.loanToken).balanceOf(address(this));
        _approveIfNeeded(params.loanToken, address(MORPHO), balance);
        (, uint shares) = MORPHO.supply(params, balance, 0, address(this), "");
        MORPHO.withdraw(params, 0, shares, address(this), address(this));
        IERC20(params.loanToken).forceApprove(address(MORPHO), 0);
        MorphoBlue.Market memory market = MORPHO.market(marketId);
        return market.totalBorrowAssets;
    }

    /**
     * @notice Approve tokens if current allowance is insufficient
     * @param token The token to approve
     * @param spender The address to approve
     * @param amount The amount to approve
     */
    function _approveIfNeeded(address token, address spender, uint256 amount) internal {
        uint256 allowance = IERC20(token).allowance(address(this), spender);
        if (allowance < amount) {
            IERC20(token).forceApprove(spender, type(uint256).max);
        }
    }
}
