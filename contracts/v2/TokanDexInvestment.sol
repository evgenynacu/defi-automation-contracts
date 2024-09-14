// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./DexInvestment.sol";
import "../interfaces/tokan/TokanPair.sol";
import "../interfaces/tokan/TokanRouter.sol";
import "../interfaces/tokan/TokanGauge.sol";

contract TokanDexInvestment is DexInvestment {
    TokanRouter public router;
    TokanPair public pair;
    TokanGauge public gauge;
    bool public stable;
    uint private decimalsA;
    TokanRouter.Route[] public rewardExchangeRoute;

    struct TokanDexInvestmentConfig {
        TokanRouter router;
        TokanPair pair;
        TokanGauge gauge;
        uint decimalsA;
        bool stable;
        TokanRouter.Route[] rewardExchangeRoute;
    }

    uint constant private UINT_MAX = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    function __TokanDexInvestment_init(string memory name_, string memory symbol_, IERC20 _primary, IERC20 _secondary, IERC20 _reward, TokanDexInvestmentConfig memory config) initializer external {
        __Context_init_unchained();
        __ERC20_init_unchained(name_, symbol_);
        __SingleTokenInvestment_init_unchained(_primary);
        __DexInvestment_init_unchained(_secondary, _reward);
        __TokanDexInvestment_init_unchained(config);
        approveAll();
    }

    function __TokanDexInvestment_init_unchained(TokanDexInvestmentConfig memory config) internal onlyInitializing {
        router = config.router;
        pair = config.pair;
        gauge = config.gauge;
        decimalsA = config.decimalsA;
        stable = config.stable;
        for (uint i = 0; i < config.rewardExchangeRoute.length; i++) {
            TokanRouter.Route memory route = config.rewardExchangeRoute[i];
            rewardExchangeRoute.push(route);
        }
    }

    function approveAll() public {
        primary.approve(address(router), UINT_MAX);
        secondary.approve(address(router), UINT_MAX);
        pair.approve(address(gauge), UINT_MAX);
        pair.approve(address(router), UINT_MAX);
        reward.approve(address(router), UINT_MAX);
    }

    /// @notice Gets reserves for both assets in the pool
    function _getReserves() internal override view returns (uint reserveA, uint reserveB) {
        (reserveA, reserveB,) = pair.getReserves();
    }

    /// @notice Gets 10**decimals for primary asset
    function _getDecimalsA() internal view override returns (uint) {
        return decimalsA;
    }

    /// @notice Calculates how much secondary tokens will be returned if mainAmount exchanged
    function _getSecondaryOut(uint mainAmount) internal view override returns (uint secondaryAmount) {
        return pair.getAmountOut(mainAmount, address(primary));
    }

    /// @notice Calculates how much primary tokens will be returned if secondaryAmount exchanged
    function _getPrimaryOut(uint secondaryAmount) internal view override returns (uint primaryAmount) {
        return pair.getAmountOut(secondaryAmount, address(secondary));
    }

    /// @notice Exchanges main and gets secondary token
    function _exchangePrimary(uint amount) internal override returns (uint out) {
        TokanRouter.Route[] memory route = new TokanRouter.Route[](1);
        route[0] = TokanRouter.Route({from: address(primary), to: address(secondary), stable: stable});
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _getSecondaryOut(amount), route, address(this), block.timestamp);
        return amounts[1];
    }

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeSecondary(uint amount) internal override returns (uint out) {
        TokanRouter.Route[] memory route = new TokanRouter.Route[](1);
        route[0] = TokanRouter.Route({from: address(secondary), to: address(primary), stable: stable});
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _getPrimaryOut(amount), route, address(this), block.timestamp);
        return amounts[1];
    }

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeRewards(uint amount) internal override returns (uint out) {
        uint _value = _getRewardValue(amount);
        emit TestValue("reward value", _value);
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _value, rewardExchangeRoute, address(this), block.timestamp);
        return amounts[rewardExchangeRoute.length];
    }

    /// @notice Returns liquidity currently in the DEX Pool
    function _getDexLiquidity() internal view override returns (uint amountA, uint amountB) {
        // @dev liquidity - total amount of Pair tokens, deposited in Gauge for this Pool
        // @dev potentially some amount can be owned by this contract and not in the gauge, but will always put Pair tokens into the gauge, so should not happen
        uint liquidity = gauge.balanceOf(address(this));

        // @dev _balance0, _balance1 - how much primary and secondary tokens pair owns (total DEX liquidity)
        uint256 _balance0 = primary.balanceOf(address(pair));
        uint256 _balance1 = secondary.balanceOf(address(pair));

        // @dev _totalSupply - how much of DEX tokens issued
        uint256 _totalSupply = pair.totalSupply();
        amountA = (liquidity * _balance0) / _totalSupply;
        amountB = (liquidity * _balance1) / _totalSupply;
    }

    /// @notice Returns liquidity currently in the DEX Pool
    function _getRewards() internal view override returns (uint amount) {
        return gauge.earned(address(this));
    }

    /// @notice Adds liquidity into DEX pool
    function _putIntoDex(uint amountA, uint amountB) internal override returns (uint resultA, uint resultB) {
        emit TestValue("amountA", amountA);
        emit TestValue("amountB", amountB);
        bool _stable = stable;
        (uint amountAQuote, uint amountBQuote,) = router.quoteAddLiquidity(address(primary), address(secondary), _stable, amountA, amountB);
        emit TestValue("amountAQuote", amountAQuote);
        emit TestValue("amountBQuote", amountBQuote);
        (uint addedA, uint addedB, uint liquidity) = router.addLiquidity(address(primary), address(secondary), _stable, amountAQuote, amountBQuote, amountAQuote, amountBQuote, address(this), block.timestamp);
        emit TestValue("addedA", addedA);
        emit TestValue("addedB", addedB);
        emit TestValue("liquidity", liquidity);

        resultA = addedA;
        resultB = addedB;

        gauge.deposit(liquidity);
    }

    /// @notice Calculates how much primary tokens will be returned if reward exchanged
    function _getRewardValue(uint rewardAmount) internal view override returns (uint primaryAmount) {
        uint[] memory amounts = router.getAmountsOut(rewardAmount, rewardExchangeRoute);
        return amounts[amounts.length - 1];
    }

    /// @notice Receives rewards and transfers them to this smart-contract
    function _receiveRewards() internal override {
        gauge.getReward();
    }

    /// @notice Removes part of the liquidity from DEX (amount/totalSupply)
    function _withdrawFromDex(uint amount, uint totalSupply) internal override returns (uint amountA, uint amountB) {
        emit TestValue("withdraw from dex amount", amount);
        emit TestValue("withdraw from dex total supply", totalSupply);
        uint toWithdraw = gauge.balanceOf(address(this)) * amount / totalSupply;
        gauge.withdraw(toWithdraw);
        (uint quoteA, uint quoteB) = router.quoteRemoveLiquidity(address(primary), address(secondary), stable, toWithdraw);
        (uint withdrawnA, uint withdrawnB) = router.removeLiquidity(address(primary), address(secondary), stable, toWithdraw, quoteA, quoteB, address(this), block.timestamp);
        amountA = withdrawnA;
        amountB = withdrawnB;
    }
}
