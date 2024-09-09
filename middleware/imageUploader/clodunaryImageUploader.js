import multer from "multer";

// Configure multer to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

export default upload;
