require("dotenv").config();
const { ethers } = require("ethers");

// ✅ Use HTTP for transactions
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC);
console.log(provider.connection);

// ✅ Use WebSocket ONLY for listening to events
const wsProvider = new ethers.WebSocketProvider(process.env.BSC_WS);

// ✅ Wallet (Signer)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log(wallet.provider);

// ✅ Router Contract (Requires a Signer)
const router = new ethers.Contract(
  process.env.PANCAKE_ROUTER,
  [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
  ],
  wallet // ✅ Ensure the wallet is signing transactions
);
console.log(router.signer);

// ✅ Factory Contract (Only needs WebSocket for event listening)
const factory = new ethers.Contract(
  process.env.PANCAKE_FACTORY,
  ["event PairCreated(address indexed token0, address indexed token1, address pair, uint)"],
  wsProvider
);

// ✅ Constants
const WBNB = ethers.getAddress("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c");
const BUY_AMOUNT = ethers.parseEther(process.env.BUY_AMOUNT);
const GAS_LIMIT = parseInt(process.env.GAS_LIMIT);
const PROFIT_THRESHOLD = 1.05; // Sell when price increases by 5%

// ✅ Debugging
if (!router) console.error("❌ Router is not initialized! Check PANCAKE_ROUTER in .env");
if (!wallet) console.error("❌ Wallet is not initialized! Check PRIVATE_KEY in .env");

module.exports = {
  provider,
  wsProvider,
  wallet,
  router,
  factory,
  WBNB,
  BUY_AMOUNT,
  GAS_LIMIT,
  PROFIT_THRESHOLD,
};
