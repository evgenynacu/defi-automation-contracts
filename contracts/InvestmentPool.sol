// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 *  @title   Investment Pool
 *  @notice  This is a base for all DEX pools. Used to automate investment in DEX pools.
 *           Basically it helps to deposit main token and earn rewards/fees and then withdraw back main token
 */
abstract contract InvestmentPool is ERC20Upgradeable {
    /// @dev ERC-20 token, used as a base for all user operations
    IERC20 public main;
    /// @dev ERC-20 secondary token (2nd token used in the DEX pool)
    IERC20 public secondary;
    /// @dev ERC-20 token which is distributed as a reward for LP
    IERC20 public reward;

    /// @dev Deposits main token
    function deposit(uint amount) external {
        require(main.transferFrom(_msgSender(), address(this), amount), "Transfer failed");


        //todo определить сколько нужно токенов main и secondary
        //todo для токана берем половину, делаем out, делаем quote. смотрим остаток.
        //todo повторяем, пока точность не будет достигнута (сколько то останется все равно)
        //todo поменять
        //todo посчитать, сколько нужно сминтить
        //todo сминтить юзеру
    }

    /// @dev Withdraws everything from the pool, exchanges all amount of secondary token to main
    /// @dev This can be done only if price in the Pool is not within safe bounds
    function safeWithdrawAll() external {

    }

    /// @dev Receives reward from the Gauge, exchanges reward to main and secondary and puts into the Pool
    function reinvestReward() external {

    }

    /// @dev Burns tokens, calculates amount of tokens to withdraw, exchanges everything to main token and transfers to the caller
    function withdraw(uint amount) external {
        uint _totalSupply = totalSupply();
        _burn(_msgSender(), amount);

        uint liquidity = _prepareWithdrawLiquidity(amount, _totalSupply);
        uint rewards = _prepareWithdrawRewards(amount, _totalSupply);
        require(main.transfer(_msgSender(), liquidity + rewards), "Transfer failure");
    }

    /// @dev Prepares to withdraw main liqudity: calculates, deprovisions, exchanges
    function _prepareWithdrawLiquidity(uint _amount, uint _totalSupply) internal returns (uint mainAmount) {
        // Calculate directly owned liquidity
        uint directly0 = main.balanceOf(address(this)) * _amount / _totalSupply;
        uint directly1 = secondary.balanceOf(address(this)) * _amount / _totalSupply;

        (uint provisioned0, uint provisioned1) = _withdrawProvisionedLiquidity(_amount, _totalSupply);

        // Calculate total amounts to withdraw in this call
        uint amount0 = directly0 + provisioned0;
        uint amount1 = directly1 + provisioned1;

        uint exchangedAmount1 = _exchangeSecondary(amount1);
        mainAmount = amount0 + exchangedAmount1;
    }


    function _prepareWithdrawRewards(uint _amount, uint _totalSupply) internal returns (uint mainAmount) {
        _receiveRewards();
        uint rewards = reward.balanceOf(address(this));
        uint userRewards = rewards * _amount / _totalSupply;

        mainAmount = _exchangeRewards(userRewards);
    }

    /// @dev Calculates the value of main and secondary assets owned by the contract (directly or provisioned)
    function _calculateLiquidity() internal view returns (uint amount0, uint amount1, uint directly0, uint directly1) {
        (uint provisioned0, uint provisioned1) = _calculateProvisionedLiquidity();

        directly0 = main.balanceOf(address(this));
        directly1 = secondary.balanceOf(address(this));
        amount0 = provisioned0 + directly0;
        amount1 = provisioned1 + directly1;
    }

    function _calculateRewards() internal view returns (uint rewards, uint directly) {
        directly = reward.balanceOf(address(this));
        rewards = _calculateEarnedRewards() + directly;
    }

    /// @dev Withdraws part of the provisioned liquidity
    function _withdrawProvisionedLiquidity(uint _balance, uint _totalSupply) internal virtual returns (uint amount0, uint amount1);

    /// @dev Transfers rewards to the account
    function _receiveRewards() internal virtual;

    /// @dev Returns rewards accumulated over time
    function _calculateEarnedRewards() internal view virtual returns (uint);

    /// @dev Returns liquidity currently in the DEX Pool
    function _calculateProvisionedLiquidity() internal view virtual returns (uint amount0, uint amount1);

    /// @dev Returns the amount of main token if reward is exchanged to main token
    function _calculateRewardAmountOut(uint amount) internal view virtual returns (uint);

    /// @dev Exchanges amount of reward token to main token
    function _exchangeRewards(uint amount) internal virtual returns (uint mainAmount);

    /// @dev Exchanges amount of secondary token to main token
    function _exchangeSecondary(uint amount) internal virtual returns (uint mainAmount);
}
