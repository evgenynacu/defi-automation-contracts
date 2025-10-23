// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

/**
 * @title IStrataStrategy
 * @notice Interface for Strata CDO Strategy contract
 */
interface IStrataStrategy {
    enum Rounding {
        Floor, // Toward negative infinity
        Ceil, // Toward positive infinity
        Trunc, // Toward zero
        Expand // Away from zero
    }

    function convertToTokens(address token, uint256 amount, Rounding rounding) external view returns (uint256);
}
