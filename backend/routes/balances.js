const express = require("express");
const router  = express.Router();
const { ethers } = require("ethers");

const PendingPayment = require("../models/PendingPayment");

router.get("/:contract/:address", async (req, res) => {
  const { contract, address } = req.params;
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
    const token    = new ethers.Contract(
      contract,
      [
        "function balanceOf(address) view returns(uint256)",
        "function symbol() view returns(string)"
      ],
      provider
    );
    const cNorm = contract.toLowerCase();
    const aNorm = address.toLowerCase();

  
    const redim = await PendingPayment.findOne({
      bondAddress: cNorm,
      holder:      aNorm,
      type:        "redemption"
    });

    if (redim) {
      const symbol = await token.symbol();
      return res.json({
        balance: "0.0",
        symbol
      });
    }

  

    const [rawBal, symbol] = await Promise.all([
      token.balanceOf(address),
      token.symbol()
    ]);
    res.json({
      balance: ethers.utils.formatUnits(rawBal, 18),
      symbol
    });
  } catch (err) {
    console.error("Error balances:", err);
    res.status(500).json({ error:"Error al obtener balance" });
  }
});

module.exports = router;
