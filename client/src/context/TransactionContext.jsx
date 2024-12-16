import React, { createContext, useEffect, useState } from 'react';

import { ethers, parseEther } from "ethers";
import TransactionsAbi from "../utils/TransactionsAbi.json"

export const TransactionContext = React.createContext();

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const { ethereum } = window;

const getEthereumContract = async () => {
    const provider = new ethers.BrowserProvider(ethereum); // Use the new provider method
    const signer = await provider.getSigner(); // Await the signer
    const transactionContract = new ethers.Contract(contractAddress, TransactionsAbi, signer);

    return transactionContract;
};

export const TransactionProvider = ({ children }) => {

    const [currentAccount, setCurrentAccount] = useState(null);
    const [formData, setFormData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    const handleData = (e, name) =>{
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    }

    const getAllTransactions = async () => {
        try {
            if (ethereum) {
                const transactionContract = await getEthereumContract();
                const availableTransactions = await transactionContract.getAllTransactions(); // This must exist in the ABI
    
                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.to,
                    addressFrom: transaction.from,
                    timestamp: new Date(transaction.timestamp * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseFloat(ethers.formatEther(transaction.amount)),
                }));

                console.log(availableTransactions);
    
                setTransactions(structuredTransactions);
            } else {
                alert("Please install MetaMask");
            }
        } catch (error) {
            console.error(error.message || "An unexpected error occurred");
            throw new Error("Error fetching transactions");
        }
    };

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
        
            const accounts = await ethereum.request({ method: "eth_accounts" });
        
            if (accounts.length > 0) {
                setCurrentAccount(accounts[0]);
        
                getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message || "An unexpected error occurred");
            throw new Error("No ethereum object");
        }
    };

    const sendTransaction = async () =>{
        try{
            if(!ethereum){
                return alert("Install Metamask Wallet");
            }
    
            const { addressTo, amount, keyword, message } = formData;

            const transactionContract = getEthereumContract();
            const parsedAmount = parseEther(amount);

            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    value: parsedAmount._hex,
                }]
            });

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            console.log(`Success - ${transactionHash.hash}`);
            setIsLoading(false);

            const transactionsCount = await transactionContract.transactionCount;

            setTransactionCount(transactionsCount.toNumber());
            window.location.reload();
        }catch (error){
            console.error("Error:", error);
            alert(error.message || "An unexpected error occurred");
            throw new Error("No ethereum object");
        }
    }

    const checkIfTransactionsExist = async () =>{
        try{
            if(ethereum){
                const transactionContract = getEthereumContract();
                const currentTransactionCount = await transactionContract.transactionCount;
                window.localStorage.setItem('transactionCount', currentTransactionCount);
            }else{
                return alert("Install Metamask");
            }
        }catch (error){
            console.error("Error:", error);
            alert(error.message || "An unexpected error occurred");
            throw new Error("No ethereum object");
        }
    }

    const connectWallet = async () =>{
        try{
            if(!ethereum){
                return alert("Install Metamask Wallet");
            }
    
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            setCurrentAccount(accounts[0]);
        }catch (error){
            console.error("Error:", error);
            alert(error.message || "An unexpected error occurred");
            throw new Error("No ethereum object");
        }
    }

    useEffect(()=>{
        // checkIfWalletIsConnected();
        // checkIfTransactionsExist();
        console.log(getAllTransactions());
    }, []);

    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, sendTransaction, handleData, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}