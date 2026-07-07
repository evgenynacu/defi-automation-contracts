// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC4626 is IERC20 {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}

/**
 * @title SusdsZap
 * @notice Zaps an arbitrary token into staked USDS (sUSDS) and back.
 * @dev Enter flow: tokenFrom -> USDS (via aggregator) -> sUSDS (native ERC4626 deposit).
 *      Exit flow:  sUSDS -> USDS (native ERC4626 redeem) -> tokenOut (via aggregator).
 *      sUSDS is a standard ERC4626 vault whose underlying asset is USDS.
 */
contract SusdsZap is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error SwapFailed(address router, string reason);

    IERC20 public immutable usds;
    IERC4626 public immutable sUsds;

    constructor(IERC20 _usds, IERC4626 _sUsds) {
        usds = _usds;
        sUsds = _sUsds;
    }

    function swapToSUSDS(IERC20 tokenFrom, address swapRouter, bytes calldata swapData, uint256 amount, uint256 minShares) external nonReentrant returns (uint256 sharesOut) {
        tokenFrom.safeTransferFrom(msg.sender, address(this), amount);

        if (address(tokenFrom) != address(usds) && swapRouter != address(0)) {
            _approveIfNeeded(tokenFrom, swapRouter);
            (bool success, bytes memory result) = swapRouter.call(swapData);
            if (!success) {
                string memory errorMessage = result.length > 0
                    ? abi.decode(result, (string))
                    : "Unknown error";

                revert SwapFailed(swapRouter, errorMessage);
            }
        }

        uint256 usdsBalance = usds.balanceOf(address(this));
        require(usdsBalance > 0, "No USDS to deposit");

        _approveIfNeeded(usds, address(sUsds));
        sharesOut = sUsds.deposit(usdsBalance, msg.sender);
        require(sharesOut >= minShares, "Slippage sUSDS");

        if (address(tokenFrom) != address(usds)) {
            _transferDust(tokenFrom, msg.sender, 1);
        }
        _transferDust(usds, msg.sender, 1);
        _transferDust(IERC20(address(sUsds)), msg.sender, 1);

        return sharesOut;
    }

    function swapSUSDSTo(IERC20 tokenOut, address swapRouter, bytes calldata swapData, uint256 shares, uint256 minOutTokenAmount) external nonReentrant returns (uint256 tokenOutAmount) {
        IERC20(address(sUsds)).safeTransferFrom(msg.sender, address(this), shares);

        uint256 usdsDelta = sUsds.redeem(shares, address(this), address(this));
        require(usdsDelta > 0, "No USDS received");

        if (address(tokenOut) != address(usds) && swapRouter != address(0)) {
            _approveIfNeeded(usds, swapRouter);
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

        if (address(tokenOut) != address(usds)) {
            _transferDust(tokenOut, msg.sender, 1);
        }
        _transferDust(usds, msg.sender, 1);
        _transferDust(IERC20(address(sUsds)), msg.sender, 1);

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
