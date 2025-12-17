// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./ReservoirPegStabilityModule.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IERC4626 is IERC20 {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}

interface IReservoirCreditEnforcer {
    function mintStablecoin(uint256 amount) external;
}

contract ReservoirWsrUsdZap {
    using SafeERC20 for IERC20;

    error SwapFailed(address router, string reason);

    IERC20 public immutable usdc;
    IERC20 public immutable rUsd;
    IERC4626 public immutable wsrUsd;
    ReservoirPegStabilityModule public immutable psm;
    IReservoirCreditEnforcer public immutable creditEnforcer;

    constructor(
        IERC20 _usdc,
        IERC20 _rUsd,
        IERC4626 _wsrUsd,
        ReservoirPegStabilityModule _psm,
        IReservoirCreditEnforcer _creditEnforcer
    ) {
        usdc = _usdc;
        rUsd = _rUsd;
        wsrUsd = _wsrUsd;
        psm = _psm;
        creditEnforcer = _creditEnforcer;
    }

    function swapToWsrUSD(IERC20 tokenFrom, address swapRouter, bytes calldata swapData, uint256 amount, uint256 minShares) external returns (uint256 sharesOut) {
        tokenFrom.safeTransferFrom(msg.sender, address(this), amount);

        if (address(tokenFrom) != address(usdc) && swapRouter != address(0)) {
            _approveIfNeeded(tokenFrom, swapRouter);
            (bool success, bytes memory result) = swapRouter.call(swapData);
            if (!success) {
                string memory errorMessage = result.length > 0
                    ? abi.decode(result, (string))
                    : "Unknown error";

                revert SwapFailed(swapRouter, errorMessage);
            }
        }

        _approveIfNeeded(usdc, address(psm));
        creditEnforcer.mintStablecoin(usdc.balanceOf(address(this)));

        uint256 rUsdBalance = rUsd.balanceOf(address(this));
        require(rUsdBalance > 0, "No rUSD minted");

        _approveIfNeeded(rUsd, address(wsrUsd));
        sharesOut = wsrUsd.deposit(rUsdBalance, msg.sender);
        require(sharesOut >= minShares, "Slippage wsrUSD");

        if (address(tokenFrom) != address(usdc)) {
            _transferDust(tokenFrom, msg.sender, 1);
        }
        _transferDust(usdc, msg.sender, 10_000);              // ~0.01 USDC
        _transferDust(rUsd, msg.sender, 1e12);                 // ~0.000001 rUSD
        _transferDust(IERC20(address(wsrUsd)), msg.sender, 1); // минимальный дст по wsrUSD

        return sharesOut;
    }

    function swapWsrUSDTo(IERC20 tokenOut, address swapRouter, bytes calldata swapData, uint256 shares, uint256 minOutTokenAmount) external returns (uint256 tokenOutAmount) {
        IERC20(address(wsrUsd)).safeTransferFrom(msg.sender, address(this), shares);

        uint256 rUsdBefore = rUsd.balanceOf(address(this));
        wsrUsd.redeem(shares, address(this), address(this));
        uint256 rUsdDelta = rUsd.balanceOf(address(this)) - rUsdBefore;
        require(rUsdDelta > 0, "No rUSD received");

        uint256 usdcAmount = rUsdDelta / 1e12;
        require(usdcAmount > 0, "Too small amount");

        _approveIfNeeded(rUsd, address(psm));
        psm.redeem(usdcAmount);

        if (address(tokenOut) != address(usdc) && swapRouter != address(0)) {
            _approveIfNeeded(usdc, swapRouter);
            (bool success, bytes memory result) = swapRouter.call(swapData);
            if (!success) {
                string memory errorMessage = result.length > 0
                    ? abi.decode(result, (string))
                    : "Unknown error";

                revert SwapFailed(swapRouter, errorMessage);
            }
        }

        tokenOutAmount = tokenOut.balanceOf(address(this));
        require(tokenOutAmount >= minOutTokenAmount, "Slippage out");

        if (address(tokenOut) != address(usdc)) {
            _transferDust(tokenOut, msg.sender, 1);
        }
        _transferDust(usdc, msg.sender, 1);
        _transferDust(rUsd, msg.sender, 1e12);
        _transferDust(IERC20(address(wsrUsd)), msg.sender, 1);

        return tokenOutAmount;
    }

    function _approveIfNeeded(IERC20 token, address spender) internal {
        if (token.allowance(address(this), spender) == 0) {
            token.forceApprove(spender, type(uint256).max);
        }
    }

    function _transferDust(IERC20 token, address to, uint256 minAmount) internal {
        uint256 bal = token.balanceOf(address(this));
        if (bal > minAmount) {
            token.safeTransfer(to, bal);
        }
    }
}
