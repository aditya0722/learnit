import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  createDiscountSchema,
  discountIdSchema,
  updateDiscountSchema,
} from "../../middleware/validation.js";
import {
  applyCoupon,
  createDiscount,
  deleteDiscount,
  getDiscountByCourseId,
  getDiscountById,
  getDiscounts,
  updateDiscount,
} from "./discounts.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const getDiscountsController = async (req, res, next) => {
  try {
    const discounts = await getDiscounts();
    res.status(200).json(new ApiResponse(200, discounts, "Discounts fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getDiscountController = async (req, res, next) => {
  try {
    const result = discountIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const discount = await getDiscountById(result.data.id);
    res.status(200).json(new ApiResponse(200, discount, "Discount fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getDiscountByCourseController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    if (!courseId || courseId <= 0) throw validationError([{ path: ["courseId"], message: "Invalid course ID" }]);

    const discount = await getDiscountByCourseId(courseId);
    res.status(200).json(new ApiResponse(200, discount, "Discount fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const createDiscountController = async (req, res, next) => {
  try {
    const result = createDiscountSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const discount = await createDiscount(result.data);
    res.status(201).json(new ApiResponse(201, discount, "Discount created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateDiscountController = async (req, res, next) => {
  try {
    const paramsResult = discountIdSchema.safeParse(req.params);
    const bodyResult = updateDiscountSchema.safeParse(req.body);

    if (!paramsResult.success) throw validationError(paramsResult.error.issues);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const discount = await updateDiscount(paramsResult.data.id, bodyResult.data);
    res.status(200).json(new ApiResponse(200, discount, "Discount updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteDiscountController = async (req, res, next) => {
  try {
    const result = discountIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    await deleteDiscount(result.data.id);
    res.status(200).json(new ApiResponse(200, null, "Discount deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export const applyCouponController = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      throw validationError([{ path: ["code"], message: "Coupon code is required" }]);
    }

    const discount = await applyCoupon(code.trim());
    res.status(200).json(new ApiResponse(200, discount, "Coupon applied successfully"));
  } catch (error) {
    next(error);
  }
};
