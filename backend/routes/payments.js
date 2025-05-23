const express = require("express");
const router  = express.Router();
const PendingPayment = require("../models/PendingPayment");


router.get("/pending", async (req, res) => {
  try {
    const list = await PendingPayment.find({ paid: false }).lean();
    res.json(list);
  } catch (err) {
    console.error("Error listando pagos pendientes:", err);
    res.status(500).json({ error: "Error al obtener pagos pendientes" });
  }
});


router.post("/:id/pay", async (req, res) => {
  try {
    const p = await PendingPayment.findByIdAndUpdate(
      req.params.id,
      { paid: true },
      { new: true }
    );
    if (!p) return res.status(404).json({ error: "Pago no encontrado" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error marcando pago:", err);
    res.status(500).json({ error: "Error al marcar pago" });
  }
});


router.get("/completed", async (req, res) => {
    try {
      const list = await PendingPayment.find({ paid: true }).lean();
      res.json(list);
    } catch (err) {
      console.error("Error listando pagos realizados:", err);
      res.status(500).json({ error: "Error al obtener pagos realizados" });
    }
  });
  

module.exports = router;