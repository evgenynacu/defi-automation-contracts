// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library StorageUtil {
    function setUintSlot(bytes32 slot, uint value) internal {
        assembly {
            sstore(slot, value)
        }
    }

    function readUintSlot(bytes32 slot) internal view returns (uint value) {
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            value := sload(slot)
        }
    }

    function setAddressSlot(bytes32 slot, address value) internal {
        assembly {
            sstore(slot, value)
        }
    }

    function readAddressSlot(bytes32 slot) internal view returns (address value) {
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            value := sload(slot)
        }
    }
}
