import express from "express";
import {
  createProduct,
  deleteProduct,
  getaProduct,
  getProduct,
  getProducts,
  updateproduct,
} from "../model/productModel.js";
import {
  buildErrorResponse,
  buildSuccessResponse,
} from "../utility/responseHelper.js";
import { adminAuth } from "../middleware/authMiddleware/authMiddleware.js";
import upload from "../middleware/imageUploader/clodunaryImageUploader.js";
import cloudinary from "../config/cloudinaryConfig.js";
import slugify from "slugify";

const productRouter = express.Router();

// GET A PRODUCT
productRouter.get("/:slug", async (req, res) => {
  try {
    const product = await getProduct(req.params.slug);

    product?.slug
      ? buildSuccessResponse(res, product, "get product successfully!")
      : buildErrorResponse(res, "Could not get the product");
  } catch (error) {
    console.error("Error fetching product:", error.message);
    buildErrorResponse(res, "Could not get a product");
  }
});

// GET A PRODUCT seller client
productRouter.get("/:_id", async (req, res) => {
  try {
    const product = await getaProduct(req.params._id);

    product?.id
      ? buildSuccessResponse(res, product, "get product successfully!")
      : buildErrorResponse(res, "Could not get the product");
  } catch (error) {
    console.error("Error fetching product:", error.message);
    buildErrorResponse(res, "Could not get a product");
  }
});

// PUBLIC ROUTE
// GET ALL PRODUCTS
productRouter.get("/", async (req, res) => {
  try {
    // Fetch products
    const products = await getProducts();

    if (products?.length) {
      buildSuccessResponse(res, products, "Products fetched successfully.");
    } else {
      buildErrorResponse(res, "No products found.");
    }
  } catch (error) {
    console.error("Error Fetching Products:", error.message);
    buildErrorResponse(res, "Could not get the products");
  }
});

// PRIVATE
// Create
productRouter.post("/", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "Product" }, (error, uploadResult) => {
          if (error) {
            return reject(error);
          }

          return resolve(uploadResult);
        })
        .end(req.file.buffer);
    });

    if (req.file) {
      req.body.thumbnail = uploadResult?.secure_url;

      // Create a slug | url friendly product name
      req.body.slug = slugify(req.body.name, {
        lower: true,
        trim: true,
      });

      const product = await createProduct(req.body);

      product?._id
        ? buildSuccessResponse(res, product, "Product Created Successfully.")
        : buildErrorResponse(res, "Could not create the product!");
    }
  } catch (error) {
    console.log(error.message);

    buildErrorResponse(res, "Could not create the product!");
  }
});

// Update
productRouter.patch(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "Product" }, (error, uploadResult) => {
              if (error) {
                return reject(error);
              }

              return resolve(uploadResult);
            })
            .end(req.file.buffer);
        });

        req.body.thumbnail = uploadResult?.secure_url;

        // Create a slug | url friendly product name
        req.body.slug = slugify(req.body.name, {
          lower: true,
          trim: true,
        });

        const product = await updateproduct(req.body);

        product?._id
          ? buildSuccessResponse(res, product, "Product Updated Successfully.")
          : buildErrorResponse(res, "Could not update the product!");
      }

      const { thumbnail, image, ...rest } = req.body;

      const product = await updateproduct(rest);

      product?._id
        ? buildSuccessResponse(res, product, "Product Updated Successfully.")
        : buildErrorResponse(res, "Could not update the product!");
    } catch (error) {
      buildErrorResponse(res, error?.message);
    }
  }
);

// product images

const uploadImagesToCloudinary = (files) => {
  return Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "Product" }, (error, uploadedResult) => {
            if (error) {
              return reject(error);
            }

            return resolve(uploadedResult);
          })
          .end(file.buffer);
      });
    })
  );
};

// update product images
productRouter.patch(
  "/productImages",
  adminAuth,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (req.files?.length > 0) {
        const uploadResults = await uploadImagesToCloudinary(req.files);

        const uplaodedImages = uploadResults.map((result) => result.secure_url);

        const { _id } = req.body;

        const current_product = await getaProduct(_id);
        const { images } = current_product;

        const updatedImages = [...images, ...uplaodedImages];
        console.log("uplaodedImages", updatedImages);

        const product = await updateproduct({ _id, images: updatedImages });

        product?._id
          ? buildSuccessResponse(
              res,
              product,
              "Product Image added Successfully."
            )
          : buildErrorResponse(res, "Could not add the images!");

        return;
      }

      buildErrorResponse(res, "Could not add the images!");
    } catch (error) {
      buildErrorResponse(res, "Could not add the images!");
    }
  }
);

// Delete
productRouter.delete(
  "/productImages/:productId",
  adminAuth,
  async (req, res) => {
    try {
      // Assuming deleteProduct is a function that deletes the product
      const deletedProduct = await deleteProduct(req.params.productId);

      if (deletedProduct && deletedProduct._id) {
        buildSuccessResponse(
          res,
          deletedProduct,
          "Product deleted successfully."
        );
      } else {
        buildErrorResponse(res, "Could not delete the product!");
      }
    } catch (error) {
      buildErrorResponse(
        res,
        "An error occurred while trying to delete the product."
      );
    }
  }
);

export default productRouter;
