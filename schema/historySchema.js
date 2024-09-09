import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: false,
    },

    status: {
      type: String,
      default: "pending",
    },
    product_name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    thumbnail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("history", historySchema);
