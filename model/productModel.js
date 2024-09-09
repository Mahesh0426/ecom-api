import productSchema from "../schema/productSchema.js";

// GET PRODUCT BY slug
export const getProduct = (slug) => {
  return productSchema.findOne({ slug });
};
// GET PRODUCT BY ID
export const getaProduct = (_id) => {
  return productSchema.findById(_id);
};

// GET ALL PRODUCTS
export const getProducts = (filter) => {
  return productSchema.find(filter);
};

// CREATE A PRODUCT
export const createProduct = (productObj) => {
  return productSchema(productObj).save();
};

// UPDATE
export const updateproduct = (updatedObject) => {
  return productSchema.findByIdAndUpdate(updatedObject?._id, updatedObject, {
    new: true,
  });
};

// DELETE
export const deleteProduct = (_id) => {
  return productSchema.findByIdAndDelete(_id);
};
