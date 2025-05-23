const express = require("express");
const router  = express.Router();
const Bond    = require("../models/Bond");
const { subscribeToDvP } = require("../dvp_listener");

const Trade   = require('../models/Trade');
const Pending = require('../models/PendingPayment');
const { BigNumber, constants, utils } = require('ethers');

router.get("/", async (req, res) => {
  const onlyActive = req.query.active === 'true';
  const filter     = onlyActive ? { redeemed: false } : {};
  const bonds      = await Bond.find(filter);
  res.json(bonds);
});


router.post("/", async (req, res) => {
  const {
    name,
    symbol,
    initialSupply,
    contractAddress,
    couponRate,
    maturityDate,
    termsIPFSHash,
    issuePrice,
    issuerAddress,
    couponIntervalDays
  } = req.body;

  if (!name || !symbol || !initialSupply || !contractAddress) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const days            = Number(couponIntervalDays);
  if (!days || days < 1) return res.status(400).json({ error: "Periodicidad inválida" });
  const intervalSeconds = days * 24 * 3600;
  const nextCoupon      = new Date(Date.now() + intervalSeconds * 1000);

  try {
    await Bond.updateOne(
      { contractAddress: contractAddress.toLowerCase() },
      {
        $set: {
          name,
          symbol,
          initialSupply,
          couponRate,
          maturityDate,
          termsIPFSHash,
          issuePrice,
          contractAddress: contractAddress.toLowerCase(),
          issuerAddress: issuerAddress?.toLowerCase()
        },
        $setOnInsert: { 
          deployedAt: new Date(),
          couponInterval: intervalSeconds,              
          nextCouponDate: nextCoupon,
          redeemed: false }
      },
      { upsert: true }
    );
    subscribeToDvP(contractAddress.toLowerCase());
    res.json({ success: true });
  } catch (err) {
    console.error("Error guardando bono:", err);
    res.status(500).json({ error: "No se pudo guardar el bono" });
  }
});


router.post("/:addr/close", async (req, res) => {
  const addr = req.params.addr.toLowerCase();

  const bond = await Bond.findOneAndUpdate(
    { contractAddress: addr },
    { redeemed: true },
    { new: true }
  );
  if (!bond) return res.status(404).json({ error: "Bono no encontrado" });

   await Bond.updateOne(
      { _id: bond._id },
      { $set: { nextCouponDate: null, couponInterval: 0 } },
      { runValidators: false }               
    );

  const holders = await Trade.aggregate([
    { $match: { contractAddress: addr } },
    { $group: { _id: "$buyer", totalTokens: { $sum: { $toDouble: "$amount" } } } }
  ]);

  const issuePriceWei = BigNumber.from(bond.issuePrice);

  for (const h of holders) {
    const balWei = utils.parseUnits(h.totalTokens.toString(), 18);
    const capWei = balWei.mul(issuePriceWei).div(constants.WeiPerEther);

    await Pending.create({
      bondAddress: addr,
      holder:      h._id,
      issuer:      bond.issuerAddress,
      type:        "redemption",
      amountWei:   capWei.toString(),
      paid:        true 
    });
  }


  await Trade.deleteMany({
    contractAddress: addr,
    buyer:           bond.issuerAddress.toLowerCase()
  });


 return res.json({ success: true, redemptions: holders.length });
});



module.exports = router;
