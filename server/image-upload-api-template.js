/**
 * IMAGE UPLOAD API TEMPLATE
 * 
 * This is a template for creating a server-side API endpoint for handling image uploads
 * in production. You can use this with Express.js, Node.js, or adapt it to other server frameworks.
 * 
 * IMPORTANT: This is just a template and needs to be implemented on your server.
 * It will NOT work as-is without proper server configuration.
 */

// Example using Express.js and multer for file uploads
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get the subdirectory from the request or use 'products' as default
    const subdirectory = req.body.subdirectory || 'products';
    
    // Create the full path
    const uploadDir = path.join(__dirname, '../dist/images', subdirectory);
    
    // Make sure the directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    
    // Set the destination
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use the provided filename or generate one
    const fileName = req.body.fileName || `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, fileName);
  }
});

// Create the multer instance
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// API endpoint for image uploads
app.post('/api/upload-image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const subdirectory = req.body.subdirectory || 'products';
    const fileName = req.file.filename;
    
    // Return the path to the uploaded file (relative to your app's base URL)
    const imageUrl = `/images/${subdirectory}/${fileName}`;
    
    return res.status(200).json({
      success: true,
      imageUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'Server error during file upload',
      message: error.message
    });
  }
});

// API endpoint for image deletion
app.delete('/api/delete-image', (req, res) => {
  try {
    const { imagePath } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'No image path provided' });
    }
    
    // Ensure the path is relative to the dist directory and doesn't try to access outside
    const relativePath = imagePath.replace(/^\/images\//, '');
    const fullPath = path.join(__dirname, '../dist/images', relativePath);
    
    // Security check - make sure we're only deleting files in the images directory
    const imagesDir = path.join(__dirname, '../dist/images');
    if (!fullPath.startsWith(imagesDir)) {
      return res.status(403).json({ error: 'Invalid image path' });
    }
    
    // Check if file exists
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      error: 'Server error during file deletion',
      message: error.message
    });
  }
});

// Static file serving from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for any routes not handled by the API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/**
 * HOW TO USE THIS TEMPLATE
 * 
 * 1. Create a 'server' directory in your project root
 * 2. Install required dependencies:
 *    npm install express multer
 * 
 * 3. Copy this file to the server directory
 * 4. Start the server with:
 *    node server/image-upload-api-template.js
 * 
 * 5. For deployment, you can:
 *    - Deploy to a Node.js hosting service like Heroku, Vercel, etc.
 *    - Set up a proxy with Nginx or Apache to forward requests to this server
 * 
 * NOTE: For production, you should add:
 *  - Authentication/Authorization to protect these endpoints
 *  - Error handling middleware
 *  - Rate limiting to prevent abuse
 *  - Consider using cloud storage like AWS S3 instead of local filesystem
 */
