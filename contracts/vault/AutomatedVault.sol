// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {RolesUpgradeable} from "../util/RolesUpgradeable.sol";
import {DelegateCall} from "../util/DelegateCall.sol";

// @notice Vault manages funds. It can have several strategies inside
// @notice Strategy is responsible for depositing/withdrawing funds from it and estimating real value
// @dev Strategy is code-only contract which is called using delegatecall
contract AutomatedVault is Initializable, ContextUpgradeable, RolesUpgradeable {
    // @dev list of strategies
    address[] public strategies;

    // @dev Operation for the rebalance
    struct Operation {
        uint16 position;
        bytes callData;
    }

    // @notice Initialized the vault. It can have any number of initialization calls for the strategies inside
    function __Vault_init(address[] calldata _strategies, Operation[] calldata _initOperations) external initializer {
        __Context_init_unchained();
        __RolesUpgradeable_init_unchained();
        __Vault_init_unchained(_strategies, _initOperations);
    }

    function __Vault_init_unchained(address[] calldata _strategies, Operation[] calldata _initOperations) internal {
        strategies = _strategies;
        executeOperations(_initOperations);
    }

    // @notice Updates list of strategies
    // @dev Can be called only by owner
    function setStrategies(address[] calldata _strategies) external onlyOwner {
        strategies = _strategies;
    }

    // @dev Rebalances the vault
    function rebalance(int256 _maxLoss, Operation[] calldata _operations) external onlyOperator returns (int256 loss) {
        loss = executeOperations(_operations);
        require(loss <= _maxLoss, "!LossExceeds");
    }

    function executeOperations(Operation[] calldata _operations) internal returns (int256 totalLoss) {
        totalLoss = 0;
        for (uint256 i = 0; i < _operations.length; i++) {
            Operation memory _operation = _operations[i];
            bytes memory result = DelegateCall.doDelegateCall(strategies[_operation.position], _operation.callData);

            if (result.length > 0) {
                int256 loss = abi.decode(result, (int256));
                totalLoss += loss;
            }
        }
    }

    /**
     * @notice Reads state from all strategies
     * @dev this is not a view function because some strategies can't have view functions (uniswap)
     */
    function readState() external returns (uint timestamp, bytes[] memory states) {
        require(_msgSender() == address(this) || _msgSender() == _owner());

        uint256 length = strategies.length;
        states = new bytes[](length);

        for (uint256 i = 0; i < length; i++) {
            address _strategy = strategies[i];
            // Call readState on each strategy using delegatecall
            bytes memory result = DelegateCall.doDelegateCall(_strategy, abi.encodePacked(AutomatedVault.readState.selector));
            states[i] = result;
        }
        timestamp = block.timestamp;
    }

}
