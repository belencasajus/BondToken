const express = require("express");
const router  = express.Router();
const Trade   = require("../models/Trade");


router.get("/account/:account", async (req, res) => {
  const account = req.params.account.toLowerCase();
  const list = await Trade.find({
    $or: [{ seller: account }, { buyer: account }]
  })
    .sort({ timestamp: -1 })
    .lean();
  res.json(list);
});

router.get("/:contract", async (req, res) => {
  const contractAddress = req.params.contract;
  const list = await Trade.find({ contractAddress })
    .sort({ timestamp: -1 })
    .lean();
  res.json(list);
});

module.exports = router;
