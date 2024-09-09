import express from "express";
import {
  createCart,
  deleteCart,
  findCart,
  getCarts,
  updateCart,
} from "../model/cartModel.js";
import {
  buildErrorResponse,
  buildSuccessResponse,
} from "../utility/responseHelper.js";
import { adminAuth } from "../middleware/authMiddleware/authMiddleware.js";
import { newCartValidation } from "../validationMiddlewarw/cartValidation.js";

const cartRouter = express.Router();

// get all the cart
cartRouter.get("/", adminAuth, async (req, res) => {
  try {
    // Extract the user ID from authmiddleware
    const { _id } = req.userInfo;

    const carts = await getCarts({ user_id: _id });

    carts && carts.length > 0
      ? buildSuccessResponse(res, carts, "All carts fetched successfully")
      : buildErrorResponse(res, "No carts found");
  } catch (error) {
    console.error("Error fetching carts:", error);
    return buildErrorResponse(res, "Could not fetch carts");
  }
});

// create a cart
cartRouter.post("/", adminAuth, newCartValidation, async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    // Check if the user is trying to add an existing item in cart
    const existingCart = await findCart({ product_id, user_id });

    if (existingCart) {
      return buildErrorResponse(res, "Item already in cart");
    }

    const cart = await createCart(req.body);

    if (cart && cart._id) {
      return buildSuccessResponse(res, cart, "Added to cart successfully!");
    } else {
      return buildErrorResponse(res, "Could not create cart");
    }
  } catch (error) {
    console.error("Error creating cart:", error);
    return buildErrorResponse(res, "Could not create cart");
  }
});

//update cart
cartRouter.patch("/", adminAuth, async (req, res) => {
  try {
    const user = req.userInfo;
    if (user.role !== "user") {
      return buildErrorResponse(res, "Not Authrized yo update a cart");
    }
    const updatedCart = await updateCart(req.body);

    updatedCart._id
      ? buildSuccessResponse(res, updatedCart, "Cart updated successfully!")
      : buildErrorResponse(res, "Could not update cart");
  } catch (error) {
    console.error("Error updating cart:", error);
    return buildErrorResponse(res, "Could not update cart");
  }
});

// Delete a cart
cartRouter.delete("/:cartId", adminAuth, async (req, res) => {
  try {
    const { cartId } = req.params;

    const deletedCart = await deleteCart(cartId);

    deletedCart?._id
      ? buildSuccessResponse(res, deletedCart, "Cart deleted successfully")
      : buildErrorResponse(res, "Could not delete cart");
  } catch (error) {
    console.log("Error deleting cart:", error);
    return buildErrorResponse(res, "Internal Server Error while deleting cart");
  }
});

export default cartRouter;
