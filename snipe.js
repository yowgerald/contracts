const { factory, WBNB } = require("./src/config");
const { buyToken } = require("./src/trade");
const { logGasPrice } = require("./src/utils");

const processedTokens = new Set(); // Prevent duplicate purchases

// Log initial gas price
logGasPrice();

// Listen for new token pairs on PancakeSwap
factory.on("PairCreated", async (token0, token1, pairAddress) => {
  console.log(`New Pair Detected: ${token0} - ${token1} at ${pairAddress}`);

  let targetToken = token0 === WBNB ? token1 : token0;

  if (processedTokens.has(targetToken)) {
    console.log(`Already processed token ${targetToken}. Skipping...`);
    return;
  }

  processedTokens.add(targetToken);
  await buyToken(targetToken);
});
