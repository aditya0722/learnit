import { eq } from "drizzle-orm";
import { db } from "../../index.js";
import { discountTable } from "../../db/schemas/discounts.js";
import { ApiError } from "../../utils/ApiError.js";
import { nextTestId, testStore } from "../../db/testStore.js";

const ensureCourse = (courseId) => {
  const courseExists = testStore.courses.some((course) => course.id === Number(courseId));
  if (!courseExists) {
    throw new ApiError(404, "Course not found");
  }
};

const generateCouponCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "LEARN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const toApiDiscount = (record) => ({
  id: record.id,
  courseId: record.courseId,
  discount: record.discount,
  couponCode: record.couponCode || null,
  expiresAt: record.expiresAt || null,
  maxUses: record.maxUses || null,
  usedCount: record.usedCount ?? 0,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const getDiscounts = async () => {
  if (process.env.NODE_ENV === "test") {
    return testStore.discounts.map(toApiDiscount);
  }

  const discounts = await db.select().from(discountTable);
  return discounts.map(toApiDiscount);
};

export const getDiscountById = async (id) => {
  const discounts = process.env.NODE_ENV === "test"
    ? testStore.discounts.filter((d) => d.id === Number(id))
    : await db.select().from(discountTable).where(eq(discountTable.id, id));

  if (discounts.length === 0) {
    throw new ApiError(404, "Discount not found");
  }

  return toApiDiscount(discounts[0]);
};

export const getDiscountByCourseId = async (courseId) => {
  const discounts = process.env.NODE_ENV === "test"
    ? testStore.discounts.filter((d) => d.courseId === Number(courseId))
    : await db.select().from(discountTable).where(eq(discountTable.courseId, courseId));

  if (discounts.length === 0) {
    return null;
  }

  return toApiDiscount(discounts[0]);
};

export const createDiscount = async ({ courseId, discount, couponCode, expiresAt, maxUses }) => {
  const code = couponCode || generateCouponCode();

  if (process.env.NODE_ENV === "test") {
    ensureCourse(courseId);

    const existing = testStore.discounts.find((d) => d.courseId === Number(courseId));
    if (existing) {
      throw new ApiError(409, "A discount already exists for this course. Update it instead.");
    }

    const record = {
      id: nextTestId("discounts"),
      courseId: Number(courseId),
      discount: String(discount),
      couponCode: code,
      expiresAt: expiresAt || null,
      maxUses: maxUses || null,
      usedCount: 0,
    };
    testStore.discounts.push(record);
    return toApiDiscount(record);
  }

  const existing = await db.select().from(discountTable).where(eq(discountTable.courseId, courseId));
  if (existing.length > 0) {
    throw new ApiError(409, "A discount already exists for this course. Update it instead.");
  }

  const [inserted] = await db.insert(discountTable).values({
    courseId,
    discount: String(discount),
    couponCode: code,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    maxUses: maxUses || null,
    usedCount: 0,
  }).returning();

  return toApiDiscount(inserted);
};

export const updateDiscount = async (id, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === "discount") return [key, String(value)];
        if (key === "expiresAt") return [key, value ? new Date(value) : null];
        return [key, value];
      })
  );

  if (process.env.NODE_ENV === "test") {
    const record = testStore.discounts.find((d) => d.id === Number(id));
    if (!record) throw new ApiError(404, "Discount not found");

    Object.assign(record, cleanData);
    return toApiDiscount(record);
  }

  await db.update(discountTable).set(cleanData).where(eq(discountTable.id, id));
  return getDiscountById(id);
};

export const deleteDiscount = async (id) => {
  if (process.env.NODE_ENV === "test") {
    const index = testStore.discounts.findIndex((d) => d.id === Number(id));
    if (index === -1) throw new ApiError(404, "Discount not found");
    testStore.discounts.splice(index, 1);
    return;
  }

  await db.delete(discountTable).where(eq(discountTable.id, id));
};

export const applyCoupon = async (couponCode) => {
  const discounts = process.env.NODE_ENV === "test"
    ? testStore.discounts.filter((d) => d.couponCode === couponCode)
    : await db.select().from(discountTable).where(eq(discountTable.couponCode, couponCode));

  if (discounts.length === 0) {
    throw new ApiError(404, "Invalid coupon code");
  }

  const discount = discounts[0];

  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    throw new ApiError(400, "This coupon has reached its usage limit");
  }

  if (process.env.NODE_ENV === "test") {
    discount.usedCount = (discount.usedCount || 0) + 1;
  } else {
    await db.update(discountTable)
      .set({ usedCount: (discount.usedCount || 0) + 1 })
      .where(eq(discountTable.id, discount.id));
  }

  return toApiDiscount({ ...discount, usedCount: (discount.usedCount || 0) + 1 });
};
