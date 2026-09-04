import * as orderModel from "../models/order.model.js";

async function createOrder(req, res, next) {
  try {
    const order = await orderModel.createWithReservation({ items: req.body.items, customer: req.body.customer });
    res.status(201).json({ message: "Pedido registrado.", order: { id: order.id, total: order.total, status: order.status, publicToken: order.publicToken } });
  } catch (error) { next(error); }
}
export { createOrder };
