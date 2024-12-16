// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol"; // Import Foundry's Script and Console for logging
import {Transactions} from "../src/Transactions.sol"; // Import your Transactions contract

contract DeployTransactions is Script {
    function run() public {
        // Start broadcasting (use your wallet for deployment)
        vm.startBroadcast();

        // Deploy the Transactions contract
        Transactions transactions = new Transactions();

        // Log the address of the deployed contract
        console.log("Transactions contract deployed at:", address(transactions));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}
