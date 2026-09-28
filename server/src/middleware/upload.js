const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Only PDF, JPG, PNG and WEBP documents are allowed."
        )
      );
    }

    callback(null, true);
  }
});

module.exports = upload;