const mongoose = require("mongoose");

const bondSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  contractAddress: { type: String, required: true, unique: true, index: true },
  initialSupply: { type: String, required: true },
  couponRate: { type: Number, required: true },
  maturityDate: { type: Number, required: true },
  termsIPFSHash: { type: String, required: true },
  issuePrice: { type: String, required: true },
  deployedAt: { type: Date, default: Date.now },
  couponInterval: { type: Number /* segs */, required: true },
  nextCouponDate: {
    type: Date,
    required: function () {
      
      return !this.redeemed;
    },
  },
  redeemed:       { type: Boolean, default: false },
  issuerAddress: { type: String, required: true } 
});

module.exports = mongoose.model("Bond", bondSchema);
