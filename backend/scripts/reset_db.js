const mongoose = require("mongoose");
require("dotenv").config();

const Bond           = require("../models/Bond");
const Trade          = require("../models/Trade");
const Approval       = require("../models/Approval");
const PendingPayment = require("../models/PendingPayment");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bonosdb";

async function resetDatabase() {
  try {
    await mongoose.connect(MONGO_URI);

    const bondCount      = await Bond.countDocuments();
    const tradeCount     = await Trade.countDocuments();
    const approvalCount  = await Approval.countDocuments();
    const pendingPayCount = await PendingPayment.countDocuments(); 

    await Bond.deleteMany({});
    await Trade.deleteMany({});
    await Approval.deleteMany({});
    await PendingPayment.deleteMany({}); 

    console.log(`Base de datos limpiada con éxito.`);
    console.log(`- Bonos eliminados:           ${bondCount}`);
    console.log(`- Operaciones eliminadas:     ${tradeCount}`);
    console.log(`- Aprobaciones eliminadas:    ${approvalCount}`);
    console.log(`- Pagos pendientes eliminados:${pendingPayCount}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error al limpiar la base de datos:", err.message);
  }
}

resetDatabase();
