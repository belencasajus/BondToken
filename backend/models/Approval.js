const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  bond:      { type: String, required: true },
  seller:    { type: String, required: true },
  buyer:     { type: String, required: true },
  amount:    { type: String, required: true },
  price:     { type: String, required: true },
  status:    { type: String, enum: ["pending","approved"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

approvalSchema.index(
  { bond:1, seller:1, buyer:1, status:1 },
  { unique:true, partialFilterExpression:{ status:"pending" } }
);

module.exports = mongoose.models.Approval
  || mongoose.model("Approval", approvalSchema);
