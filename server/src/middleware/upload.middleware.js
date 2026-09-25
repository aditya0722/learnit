import multer from "multer";
import path from "path";
import fs from "fs";

const createFolder = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
};

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        let folder;

        if (file.fieldname === "thumbnail") {
            folder = "uploads/thumbnails";
        }
        else if (file.fieldname === "video") {
            folder = "uploads/courses";
        }
        else {
            return cb(new Error("Invalid file field"));
        }

        createFolder(folder);

        cb(null, folder);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        const filename =
            `${file.fieldname}-${Date.now()}${extension}`;

        cb(null, filename);
    }
});

export const upload = multer({
    storage
});