const express = require("express");
const router = express.Router();
const Order = require("../model/order"); // Adjust path as needed
const User = require("../model/user"); // Adjust path as needed

router.post("/place-order", async (req, res) => {
  try {
    const { email, orderItems, shippingAddress } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "Order items are required." });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required." });
    }

    // Retrieve user _id from the user collection using the provided email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create separate orders for each order item
    const orderPromises = orderItems.map(async (item) => {
      const totalAmount = item.price * item.quantity;
      const order = new Order({
        user: user._id,
        orderItems: [item], // Each order contains a single item
        shippingAddress,
        totalAmount,
      });
      return order.save();
    });

    const orders = await Promise.all(orderPromises);

    user.cart = [];
    await user.save();

    res
      .status(201)
      .json({
        message: "Orders placed and cart cleared successfully.",
        orders,
      });
  } catch (error) {
    console.error("Error placing orders:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-orders", async (req, res) => {
  try {
    const { email } = req.query;

    // Validate the email parameter
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Retrieve user _id from the user collection using the provided email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find all orders associated with the user
    const orders = await Order.find({ user: user._id });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/myorders", async (req, res) => {
  try {
    // Retrieve email from query parameters
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Retrieve orders for the user
    const orders = await Order.find({ user: user._id });
    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
