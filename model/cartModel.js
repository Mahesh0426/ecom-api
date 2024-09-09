import cartSchema from "../schema/cartSchema.js";

// GET ALL Carts
export const getCarts = (filter) => {
  return cartSchema.find(filter);
};

// CREATE A Carts
export const createCart = (cartObj) => {
  return cartSchema(cartObj).save();
};
// find one cart
export const findCart = (filter) => {
  return cartSchema.findOne(filter);
};

// UPDATE
export const updateCart = (updatedObject) => {
  return cartSchema.findByIdAndUpdate(updatedObject?._id, updatedObject, {
    new: true,
  });
};

// DELETE
export const deleteCart = (_id) => {
  return cartSchema.findByIdAndDelete(_id);
};
