import express from "express";
import {
  applyCouponController,
  createDiscountController,
  deleteDiscountController,
  getDiscountByCourseController,
  getDiscountController,
  getDiscountsController,
  updateDiscountController,
} from "./discounts.controller.js";

const DiscountsRouter = express.Router();

DiscountsRouter.get("/", getDiscountsController);
DiscountsRouter.get("/:id", getDiscountController);
DiscountsRouter.get("/course/:courseId", getDiscountByCourseController);
DiscountsRouter.post("/", createDiscountController);
DiscountsRouter.post("/apply-coupon", applyCouponController);
DiscountsRouter.patch("/:id", updateDiscountController);
DiscountsRouter.delete("/:id", deleteDiscountController);

export default DiscountsRouter;
