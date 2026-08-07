// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {DelegateCall} from "../util/DelegateCall.sol";
import {HasOperation} from "./HasOperation.sol";
import {IPoolManager} from "../uniswap-v4/IPoolManager.sol";
import {RolesUpgradeable} from "../util/RolesUpgradeable.sol";
import {StorageUtil} from "../util/StorageUtil.sol";

// @notice Vault manages funds. It can have several strategies inside
// @dev Strategy is code-only contract which is called using delegatecall
contract AutomatedVault is HasOperation, IFlashLoanSimpleReceiver, Initializable, ContextUpgradeable, RolesUpgradeable {
    using SafeERC20 for IERC20;

    // Morpho contract address
    address private immutable MORPHO_ADDRESS;
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;
    // Uniswap v4 PoolManager, zero where v4 is not deployed
    address private immutable UNISWAP_V4_POOL_MANAGER;
    // Instadapp flash aggregator, zero where it is not deployed
    address private immutable INSTA_FLASH;

    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");

    // @notice list of strategies
    address[] private strategies;

    bool private rebalancing;

    constructor (address _morpho, address aaveProvider, address uniswapV4PoolManager, address instaFlash) {
        MORPHO_ADDRESS = _morpho;
        ADDRESSES_PROVIDER = IPoolAddressesProvider(aaveProvider);
        POOL = IPool(IPoolAddressesProvider(aaveProvider).getPool());
        UNISWAP_V4_POOL_MANAGER = uniswapV4PoolManager;
        INSTA_FLASH = instaFlash;
        _disableInitializers();
    }

    // @notice Guards a flash loan callback.
    // @dev Both halves are needed. `rebalancing` is only true while the vault is making external calls,
    //      so on its own it is not a caller check: a strategy hands control to arbitrary addresses
    //      mid-rebalance (SwapStrategy calls a router supplied by an off-chain quote), and any of them
    //      could call back in. Pinning msg.sender to the flash loan provider is what makes that safe —
    //      an `initiator` argument cannot, since the caller chooses it.
    modifier onlyFlashLoanCallback(address provider) {
        require(rebalancing, "!NotRebalancing");
        require(msg.sender == provider, "!UnexpectedCaller");
        _;
    }

    // @notice Runs the operations funded by a flash loan and records their output.
    // @dev Single writer for FLASH_LOAN_OUT_SLOT; the flash loan strategies read and clear it.
    function _runFlashLoanOperations(Operation[] memory operations) internal {
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, executeOperations(operations));
    }

    // @notice Initialized the vault. It can have any number of initialization calls for the strategies inside
    function __Vault_init(address[] calldata _strategies) external initializer {
        __Context_init_unchained();
        __RolesUpgradeable_init_unchained();
        __Vault_init_unchained(_strategies);
    }

    function __Vault_init_unchained(address[] calldata _strategies) internal {
        strategies = _strategies;
    }

    // @notice Updates list of strategies
    // @dev Can be called only by owner
    function setStrategies(address[] calldata _strategies) external onlyOwner {
        strategies = _strategies;
    }

    function getStrategies() external view returns (address[] memory) {
        return strategies;
    }

    // @dev Rebalances the vault
    // @return uint value returned from the swap strategy (if it's used)
    function rebalance(Operation[] calldata _operations) external operatorOrOwner returns (uint out) {
        rebalancing = true;
        out = executeOperations(_operations);
        rebalancing = false;
    }

    function executeOperations(Operation[] memory _operations) internal returns (uint out) {
        out = 0;
        for (uint256 i = 0; i < _operations.length; i++) {
            Operation memory _operation = _operations[i];
            bytes memory result = DelegateCall.doDelegateCall(strategies[_operation.position], _operation.callData);

            if (result.length > 0) {
                out = abi.decode(result, (uint256));
            }
        }
    }

    /**
     * @notice Callback function for Morpho flash loans
     * @dev Called by Morpho after sending flash loaned tokens to this contract
     * @param amount The amount that was borrowed
     * @param data Raw bytes data to be used for operations
     */
    function onMorphoFlashLoan(
        uint256 amount,
        bytes calldata data
    ) external onlyFlashLoanCallback(_getMorphoAddress()) {
        OperationsWithAddress memory received = abi.decode(data, (OperationsWithAddress));
        _runFlashLoanOperations(received.operations);

        // Transfer tokens back to Morpho to repay the loan
        // This will automatically revert if there aren't enough tokens
        IERC20(received.token).forceApprove(_getMorphoAddress(), amount);
    }

    // Aave v3 flash loan callback
    function executeOperation(
        address token,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external onlyFlashLoanCallback(address(POOL)) returns (bool) {
        require(initiator == address(this));

        Operation[] memory operations = abi.decode(params, (Operation[]));
        _runFlashLoanOperations(operations);

        IERC20(token).forceApprove(address(POOL), amount + premium);
        return true;
    }

    // Multi-token flash loan callback (used by Instadapp Flash Aggregator)
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external onlyFlashLoanCallback(INSTA_FLASH) returns (bool) {
        require(initiator == address(this));
        require(assets.length == 1, "Single token only");

        Operation[] memory operations = abi.decode(params, (Operation[]));
        _runFlashLoanOperations(operations);

        IERC20(assets[0]).safeTransfer(msg.sender, amounts[0] + premiums[0]);
        return true;
    }

    /**
     * @notice Callback for a Uniswap v4 flash loan
     * @dev v4 has no flashLoan entry point. Inside unlock the borrowed amount is taken, the operations
     *      run, and the same amount is returned — the PoolManager only requires deltas to net to zero,
     *      so nothing is paid for it. Settling requires sync() before the transfer, since settle()
     *      credits the balance difference since the snapshot.
     * @param data abi.encode(token, amount, Operation[])
     */
    function unlockCallback(bytes calldata data)
        external
        onlyFlashLoanCallback(UNISWAP_V4_POOL_MANAGER)
        returns (bytes memory)
    {
        address poolManager = UNISWAP_V4_POOL_MANAGER;
        (address token, uint256 amount, Operation[] memory operations) =
                            abi.decode(data, (address, uint256, Operation[]));

        IPoolManager(poolManager).take(token, address(this), amount);

        _runFlashLoanOperations(operations);

        // This reverts if the operations did not leave enough behind to repay
        IPoolManager(poolManager).sync(token);
        IERC20(token).safeTransfer(poolManager, amount);
        IPoolManager(poolManager).settle();

        return "";
    }

    function _getMorphoAddress() internal view returns (address) {
        return MORPHO_ADDRESS;
    }
}
