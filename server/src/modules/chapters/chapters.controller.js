import { getChapters, addChapters, updateChapters,deleteChapters } from "./chapters.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
    chapterIdParamsSchema,
    chapterParamsSchema,
    createChapterSchema,
    updateChapterSchema,
} from "../../middleware/validation.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const AddChapters= async(req,res,next)=>{
    try{
        const paramsResult = chapterParamsSchema.safeParse(req.params);
        const thumbnail = req.files?.thumbnail?.[0]?.filename || req.files?.thumbnail?.[0]?.path || req.body.thumbnail;
        const videoUrl = req.files?.video?.[0]?.filename || req.files?.video?.[0]?.path || req.body.videoUrl;
        const bodyResult = createChapterSchema.safeParse({
            ...req.body,
            thumbnail,
            videoUrl,
        });

        if (!paramsResult.success) {
            throw validationError(paramsResult.error.issues);
        }

        if (!bodyResult.success) {
            throw validationError(bodyResult.error.issues);
        }

        await addChapters({
            ...bodyResult.data,
            courseId: paramsResult.data.courseId,
        });
        res
            .status(201)
            .json(new ApiResponse(201, null, "Chapter added successfully"));
    }
    catch(error){
        next(error);
    }
   
}
export const getAllChapters= async(req,res,next)=>{
    try{
        const result = chapterParamsSchema.safeParse(req.params);

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        const chapters = await getChapters(result.data.courseId);
        res
            .status(200)
            .json(new ApiResponse(200, chapters, "Chapters fetched successfully"));
    }
    catch(error){
        next(error);
    }
    
}
export const DeleteChapters= async(req,res,next)=>{
    try{
        const result = chapterIdParamsSchema.safeParse(req.params);

        if (!result.success) {
            throw validationError(result.error.issues);
        }

        await deleteChapters(result.data.chapterId);
        res
            .status(200)
            .json(new ApiResponse(200, null, "Chapter deleted successfully"));
    }
    catch(error){
        next(error);
    }
}

export const UpdateChapters= async( req,res,next)=>{
    try{
        const paramsResult = chapterIdParamsSchema.safeParse(req.params);
        const bodyResult = updateChapterSchema.safeParse(req.body);

        if (!paramsResult.success) {
            throw validationError(paramsResult.error.issues);
        }

        if (!bodyResult.success) {
            throw validationError(bodyResult.error.issues);
        }

        await updateChapters(paramsResult.data.chapterId, bodyResult.data);
        res
            .status(200)
            .json(new ApiResponse(200, null, "Chapter updated successfully"));
    }
    catch(error){
        next(error);
    }
}
