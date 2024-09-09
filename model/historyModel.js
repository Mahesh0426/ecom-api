import historySchema from "../schema/historySchema.js";

// create a order history
export const createOrderHistory = (orderObj) => {
  return historySchema(orderObj).save();
};

// get order history
export const getOrderHistory = (filter) => {
  return historySchema.find(filter);
};

//update a status from admin
export const updateStatus = (filter, updatedStatus) => {
  return historySchema.findOneAndUpdate(filter, updatedStatus, {
    new: true,
  });
};

// delete order history
export const deleteOrderHistory = (_id) => {
  return historySchema.findByIdAndDelete(_id);
};
