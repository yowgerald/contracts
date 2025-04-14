const { ethers } = require("ethers");
const { provider, wallet, router } = require("./config");

// Log Gas Price
async function logGasPrice() {
  try {
    const feeData = await provider.getFeeData();
    console.log(`Current Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} Gwei`);
  } catch (err) {
    console.error(`Failed to fetch gas price: ${err.message}`);
  }
}

// Check Token Balance
async function checkBalance(tokenAddress) {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function balanceOf(address owner) view returns (uint)",
      "function decimals() view returns (uint8)"
    ],
    provider
  );

  try {
    const balance = await tokenContract.balanceOf(wallet.address);
    const decimals = await tokenContract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch (err) {
    console.error(`Failed to fetch balance for ${tokenAddress}: ${err.message}`);
    return 0;
  }
}

// Fetch Token Price
async function getTokenPrice(tokenAddress) {
  try {
    const pairContract = new ethers.Contract(
      tokenAddress,
      ["function getReserves() view returns (uint112, uint112, uint32)"],
      provider
    );

    const [reserve0, reserve1] = await pairContract.getReserves();
    return reserve1 / reserve0; // Approximate price calculation
  } catch (err) {
    console.error(`Failed to fetch token price: ${err.message}`);
    return null;
  }
}

// Check if token is sellable (avoid honeypots)
async function isSellable(tokenAddress) {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ["function approve(address spender, uint256 amount) public returns (bool)"],
      provider
    );

    const testApprove = await tokenContract.approve(router.target, ethers.parseUnits("1", 18));
    return !!testApprove;
  } catch (err) {
    console.error(`Sellability Check Failed: ${err.message}`);
    return false;
  }
}

// Check liquidity before buying
async function checkLiquidity(tokenAddress) {
  try {
    const reserves = await router.getReserves(tokenAddress);
    const liquidity = ethers.formatUnits(reserves[0], 18);
    return liquidity > 1; // Ensure there's at least 1 token in reserve
  } catch (err) {
    console.error(`Liquidity Check Failed: ${err.message}`);
    return false;
  }
}

module.exports = {
  logGasPrice,
  checkBalance,
  getTokenPrice,
  isSellable,
  checkLiquidity
};
