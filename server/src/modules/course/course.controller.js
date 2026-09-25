import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
    buyCourseSchema,
    courseIdSchema,
    createCourseSchema,
    updateCourseSchema,
} from "../../middleware/validation.js";

import {
    select as getAllCourses,
    selectById,
    insert,
    remove,
    update,
    buy
} from "./course.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const getAllCourse = async (req, res, next) => {
    try {
        const data = await getAllCourses();

        res
            .status(200)
            .json(new ApiResponse(200, data, "Courses fetched successfully"));

    } catch (error) {
        next(error);
    }
};

export const getCourseById = async (req, res, next) => {
    try {
        const result = courseIdSchema.safeParse(req.params);

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        const course = await selectById(result.data.id);

        if (!course) {
            throw new ApiError(404, "Course not found");
        }

        res
            .status(200)
            .json(new ApiResponse(200, course, "Course fetched successfully"));

    } catch (error) {
        next(error);
    }
};


export const AddCourse = async (req, res, next) => {
    try {
        const fileThumbnail = req.files?.thumbnail?.[0]?.path;
        const result = createCourseSchema.safeParse({
            ...req.body,
            thumbnail: fileThumbnail || req.body.thumbnail,
        });

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        await insert(result.data);

        res
            .status(201)
            .json(new ApiResponse(201, null, "Course added successfully"));

    } catch (error) {
        next(error);
    }
};


export const RemoveCourse = async (req, res, next) => {
    try {
        const result = courseIdSchema.safeParse(req.params);

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        await remove(result.data.id);

        res
            .status(200)
            .json(new ApiResponse(200, null, "Course removed successfully"));

    } catch (error) {
        next(error);
    }
};


export const EditCourse = async (req, res, next) => {
    try {
        const paramsResult = courseIdSchema.safeParse(req.params);
        const bodyResult = updateCourseSchema.safeParse(req.body);

        if (!paramsResult.success) {
            throw validationError(paramsResult.error.issues);
        }

        if (!bodyResult.success) {
            throw validationError(bodyResult.error.issues);
        }

        await update(paramsResult.data.id, bodyResult.data);

        res
            .status(200)
            .json(new ApiResponse(200, null, "Course updated successfully"));

    } catch (error) {
        next(error);
    }
};


export const BuyCourse = async (req, res, next) => {
    try {
        const result = buyCourseSchema.safeParse({
            ...req.body,
            userId: req.user.id,
        });

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        const { userId, courseId, price } = result.data;

        await buy(
            userId,
            courseId,
            price
        );

        res
            .status(201)
            .json(new ApiResponse(201, null, "Course purchased successfully"));

    } catch (error) {
        next(error);
    }
};
