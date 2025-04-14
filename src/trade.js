const { ethers } = require("ethers");
const { router, wallet, WBNB, GAS_LIMIT, PROFIT_THRESHOLD, BUY_AMOUNT, SLIPPAGE } = require("./config");
const { logGasPrice, checkBalance, getTokenPrice, isSellable, checkLiquidity } = require("./utils");

// Sell Token if Price Reaches Profit Threshold
async function sellToken(tokenAddress, buyPrice) {
  const balance = await checkBalance(tokenAddress);
  if (balance === 0) return;

  const currentPrice = await getTokenPrice(tokenAddress);
  if (!currentPrice) return;

  const profitMargin = currentPrice / buyPrice;
  if (profitMargin >= PROFIT_THRESHOLD) {
    console.log(`Selling ${balance} tokens for profit!`);
    await logGasPrice(); // Log gas price before selling

    try {
      const amountOutMin = ethers.parseUnits((balance * (1 - SLIPPAGE)).toString(), 18); // Apply slippage

      const tx = await router.swapExactTokensForETH(
        ethers.parseUnits(balance.toString(), 18),
        amountOutMin, // Prevent high slippage loss
        [tokenAddress, WBNB],
        wallet.address,
        Math.floor(Date.now() / 1000) + 60,
        { gasLimit: GAS_LIMIT }
      );

      console.log(`Sell Transaction Sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Sell Success: ${tx.hash}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (err) {
      console.error(`Sell Failed: ${err.message}`);
    }
  } else {
    console.log(`Waiting for better profit... Current Margin: ${profitMargin.toFixed(2)}x`);
  }
}

// Buy Token when New Pair is Created
async function buyToken(tokenAddress) {
  console.log(`Checking token safety for: ${tokenAddress}`);
  
  // Check if token is a honeypot (not sellable)
  if (!(await isSellable(tokenAddress))) {
    console.log(`Token ${tokenAddress} is NOT sellable! Skipping...`);
    return;
  }

  // Check liquidity before buying
  if (!(await checkLiquidity(tokenAddress))) {
    console.log(`Insufficient liquidity for ${tokenAddress}. Skipping...`);
    return;
  }

  console.log(`Attempting to buy: ${tokenAddress}`);
  await logGasPrice(); // Log gas price before buying

  try {
    const amountOutMin = ethers.parseUnits((BUY_AMOUNT * (1 - SLIPPAGE)).toString(), 18); // Apply slippage

    const tx = await router.swapExactETHForTokens(
      amountOutMin, // Prevent high slippage loss
      [WBNB, tokenAddress],
      wallet.address,
      Math.floor(Date.now() / 1000) + 60,
      {
        value: BUY_AMOUNT,
        gasLimit: GAS_LIMIT,
      }
    );

    console.log(`Buy Transaction Sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Buy Success: ${tx.hash}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);

    // Get Buy Price
    const buyPrice = await getTokenPrice(tokenAddress);
    if (!buyPrice) return;

    console.log(`Bought at price: ${buyPrice}`);

    // Monitor and check for selling condition
    setTimeout(() => sellToken(tokenAddress, buyPrice), 60000);
  } catch (err) {
    console.error(`Buy Failed: ${err.message}`);
  }
}

module.exports = {
  buyToken,
  sellToken,
};
