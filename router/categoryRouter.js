import express from "express";
import { adminAuth } from "../middleware/authMiddleware/authMiddleware.js";
import upload from "../middleware/imageUploader/clodunaryImageUploader.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../model/categotyModel.js";
import {
  buildErrorResponse,
  buildSuccessResponse,
} from "../utility/responseHelper.js";
import cloudinary from "../config/cloudinaryConfig.js";
import slugify from "slugify";

const categoryRouter = express.Router();

// Public Routes
// Get All Categories
categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await getCategories();

    if (categories?.length) {
      buildSuccessResponse(res, categories, "Categories");
    } else {
      console.error("No categories found");
      buildErrorResponse(res, "Could not fetch data");
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    buildErrorResponse(res, "Could not fetch data");
  }
});

// private route | create category
categoryRouter.post(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      // Check if the file is provided
      if (!req.file) {
        return buildErrorResponse(res, "No image file provided.");
      }

      // Upload image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "Category" }, (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(error);
            }
            resolve(result);
          })
          .end(req.file.buffer);
      });

      // Set the URL of the uploaded image in req.body.thumbnail
      req.body.thumbnail = uploadResult.secure_url;

      // Check if title is provided
      if (!req.body.title) {
        return buildErrorResponse(res, "Category title is required.");
      }

      // Generate slug from the category name
      req.body.slug = slugify(req.body.title, {
        lower: true,
        trim: true,
      });

      // Create the category in the database
      const category = await createCategory(req.body);

      // Check if category creation was successful
      if (category && category._id) {
        return buildSuccessResponse(
          res,
          category,
          "Category created successfully"
        );
      } else {
        console.log("Category Creation Error:", category);
        return buildErrorResponse(res, "Could not create category.");
      }
    } catch (error) {
      // Log the specific error
      console.error("Error in category creation:", error);
      return buildErrorResponse(
        res,
        "An error occurred while creating the category."
      );
    }
  }
);

// Update Category
categoryRouter.patch(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.file) {
        const uploadResult = await new Promise((resolve) => {
          cloudinary.uploader
            .upload_stream({ folder: "Category" }, (error, uploadResult) => {
              if (error) {
                return reject(error);
              }

              return resolve(uploadResult);
            })
            .end(req.file.buffer);
        });

        req.body.thumbnail = uploadResult?.secure_url;

        const category = await updateCategory(req.body);

        return category?._id
          ? buildSuccessResponse(res, category, "Category updated successfully")
          : buildErrorResponse(res, "Could not update category.");
      }

      // when image is not sent or updated
      const { title, _id } = req.body;
      const updatedCategory = { _id, title };

      const category = await updateCategory(updatedCategory);

      category?._id
        ? buildSuccessResponse(res, category, "Category updated successfully")
        : buildErrorResponse(res, "Could not update category.");
    } catch (error) {
      buildErrorResponse(res, "Could not update category.");
    }
  }
);

// Delete Category
categoryRouter.delete("/:categoryId", adminAuth, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await deleteCategory(categoryId);

    category?._id
      ? buildSuccessResponse(res, category, "Category deleted successfully")
      : buildErrorResponse(res, "Could not delete category");
  } catch (error) {
    buildErrorResponse(res, "Could not delete category");
  }
});

export default categoryRouter;
