import Joi from "joi";
import { buildErrorResponse } from "../utility/responseHelper.js";

const REQUIRED_STRING = Joi.string().required();

export const newCartValidation = (req, res, next) => {
  try {
    const schema = Joi.object({
      product_id: REQUIRED_STRING,
      product_name: REQUIRED_STRING,
      user_id: REQUIRED_STRING,
      user_name: REQUIRED_STRING,
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().required(),
      thumbnail: REQUIRED_STRING,
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error);
      return buildErrorResponse(res, error.message);
    }

    next();
  } catch (error) {
    buildErrorResponse(res, error.message);
  }
};
