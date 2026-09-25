import express from "express";
import { AddChapters,UpdateChapters,DeleteChapters,getAllChapters } from "./chapters.controller.js";
import { uploadChapterFiles } from "../../middleware/cloudinaryUpload.js";
const ChaptersRouter = express.Router({ mergeParams: true });

ChaptersRouter.get("/", getAllChapters);
ChaptersRouter.post("/", uploadChapterFiles, AddChapters);
ChaptersRouter.put("/:chapterId", UpdateChapters);
ChaptersRouter.delete("/:chapterId", DeleteChapters);

export default ChaptersRouter;
