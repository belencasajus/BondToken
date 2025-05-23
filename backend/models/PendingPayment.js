const mongoose = require("mongoose");

const pendingPaymentSchema = new mongoose.Schema({
  bondAddress: { type: String, required: true },
  holder:      { type: String, required: true },
  amountWei:   { type: String, required: true },
  type:        { type: String, enum: ["coupon", "redemption"], required: true },
  issuer:      { type: String, required: true }, 
  paid:        { type: Boolean, default: false },
  scheduledAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PendingPayment", pendingPaymentSchema);
