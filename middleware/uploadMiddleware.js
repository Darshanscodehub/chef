const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads' folder
    },
    filename(req, file, cb) {
        // Name the file: fieldname-date.extension (e.g., idproof-123456.jpg)
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// Check file type (Images only)
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;