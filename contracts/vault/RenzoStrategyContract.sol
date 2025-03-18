// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface RenzoProtocol {
    function depositETH() external payable;
}

interface WETH {
    function withdraw(uint256 wad) external;
}

/**
 * @title RenzoStrategy
 * @notice Strategy for interacting with Renzo protocol (able to deposit ETH and get ezETH)
 */
contract RenzoStrategy {
    using SafeERC20 for IERC20;

    // Events
    event EthDeposited(uint256 ethValue, uint256 ezEthValue);

    address public immutable WETH_TOKEN;
    address public immutable RENZO_PROTOCOL;

    constructor(
        address _wethToken,
        address _renzoProtocol
    ) {
        WETH_TOKEN = _wethToken;
        RENZO_PROTOCOL = _renzoProtocol;
    }

    function depositEth(uint256 amount) external {
        uint256 depositAmount;

        // If max uint is passed, deposit all available USDS
        if (amount == type(uint256).max) {
            depositAmount = IERC20(WETH_TOKEN).balanceOf(address(this));
        } else {
            depositAmount = amount;
        }

        require(depositAmount > 0, "Amount must be greater than 0");

        WETH(WETH_TOKEN).withdraw(depositAmount);
        RenzoProtocol(RENZO_PROTOCOL).depositETH{value: depositAmount}();
    }


    /**
     * @notice Reads the current state of the strategy
     * @dev Returns information about token balances and the current price per share
     * @return State encoded as bytes with token balances and share price
     */
    function readState() external pure returns (bytes memory) {
        return new bytes(0);
    }

    /**
     * @notice Initialize the strategy
     * @dev Called via delegatecall from the vault
     */
    function init() external {
        // No special initialization needed
    }
}