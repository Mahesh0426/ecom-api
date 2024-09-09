import express from "express";
import { adminAuth } from "../middleware/authMiddleware/authMiddleware.js";
import {
  createOrderHistory,
  getOrderHistory,
  updateStatus,
} from "../model/historyModel.js";
import {
  buildErrorResponse,
  buildSuccessResponse,
} from "../utility/responseHelper.js";

const historyRouter = express.Router();

// create a order history
historyRouter.post("/", adminAuth, async (req, res) => {
  try {
    // Extract the user ID from auth middleware
    const { _id } = req.userInfo;

    const orderHistory = await createOrderHistory({
      user_id: _id,
      ...req.body,
    });

    orderHistory?._id
      ? buildSuccessResponse(
          res,
          orderHistory,
          "Order history created successfully!"
        )
      : buildErrorResponse(res, "Could not create order history");
  } catch (error) {
    console.error("Error creating order history:", error);
    return buildErrorResponse(res, "Could not create order history");
  }
});

// Get all order histories
historyRouter.get("/", adminAuth, async (req, res) => {
  try {
    // Extract the user ID and role from auth middleware
    const { _id, role } = req.userInfo;

    if (role === "admin") {
      // If the user is an admin, fetch all order histories
      const orderHistory = await getOrderHistory({});

      return orderHistory && orderHistory.length > 0
        ? buildSuccessResponse(
            res,
            orderHistory,
            "All order histories fetched successfully!"
          )
        : buildErrorResponse(res, "No order history found for any user");
    } else {
      // If the user is a normal user, fetch only their own order history
      const orderHistory = await getOrderHistory({ user_id: _id });

      return orderHistory && orderHistory.length > 0
        ? buildSuccessResponse(
            res,
            orderHistory,
            "Your order history fetched successfully!"
          )
        : buildErrorResponse(res, "No order history found for you");
    }
  } catch (error) {
    console.error("Error fetching order history:", error);
    return buildErrorResponse(res, "Could not fetch order history");
  }
});

//update cart status from admin side only
historyRouter.patch("/:_id", adminAuth, async (req, res) => {
  try {
    const user = req.userInfo;
    if (user.role !== "admin") {
      return buildErrorResponse(res, "Not Authrized yo update a cart");
    }

    const { _id } = req.params;
    const { status } = req.body;

    const updatedCart = await updateStatus({ _id }, { status });

    updatedCart._id
      ? buildSuccessResponse(
          res,
          updatedCart,
          "Cart status updated successfully!"
        )
      : buildErrorResponse(res, "Could not update cart status");
  } catch (error) {
    console.log("Error updating cart status:", error);
    return buildErrorResponse(res, "Could not update cart status");
  }
});

export default historyRouter;
