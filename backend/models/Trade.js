const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  contractAddress: { type: String, required: true, index: true },
  seller:          { type: String, required: true },
  buyer:           { type: String, required: true },
  amount:          { type: String, required: true },
  price:           { type: String, required: true }, 
  txHash:          { type: String, required: true, unique: true },
  timestamp:       { type: Date,   default: Date.now }
});

module.exports = mongoose.model("Trade", tradeSchema);
