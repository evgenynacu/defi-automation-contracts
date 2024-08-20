// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {InvestmentPool} from "./InvestmentPool.sol";
import "./TokanGauge.sol";
import "./TokanPair.sol";

abstract contract TokanInvestmentPool is InvestmentPool {
    TokanPair public pair;
    TokanGauge public gauge;

    /// @dev Returns liquidity currently in the DEX Pool
    function _calculateProvisionedLiquidity() internal view override returns (uint amount0, uint amount1) {
        // liquidity - total amount of Pair tokens, deposited in Gauge for this Pool
        // potentially some amount can be owned by this contract and not in the gauge, but will always put Pair tokens into the gauge, so should not happen
        uint liquidity = gauge.balanceOf(address(this));

        // _balance0, _balance1 - how much main and secondary tokens pair owns
        uint256 _balance0 = main.balanceOf(address(pair));
        uint256 _balance1 = secondary.balanceOf(address(pair));

        uint256 _totalSupply = pair.totalSupply();
        amount0 = (liquidity * _balance0) / _totalSupply;
        amount1 = (liquidity * _balance1) / _totalSupply;
    }

    function _withdrawProvisionedLiquidity(uint _balance, uint _totalSupply) internal override returns (uint amount0, uint amount1) {
        revert("not implemented");
    }

    function _calculateEarnedRewards() internal view override returns (uint) {
        return gauge.earned(address(this));
    }

    function _receiveRewards() internal override {
        gauge.getReward();
    }
}
