// cloudinary.js
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Lade Umgebungsvariablen
dotenv.config();

// Cloudinary konfigurieren
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Funktion zum Hochladen eines Bildes
const uploadImage = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: folder },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        ).end(fileBuffer);
    });
};

module.exports = { uploadImage };