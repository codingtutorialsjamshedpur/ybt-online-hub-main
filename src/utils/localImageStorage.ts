/**
 * Utility functions for handling image storage in both development and production environments
 */

// Determine if we're in a production environment
const isProduction = import.meta.env.PROD;

/**
 * Save an image file for use in the application
 * 
 * In development: Simulates local storage as real file writing requires server code
 * In production: Uses a server API endpoint to handle the upload
 * 
 * @param file File to save
 * @param subdirectory Optional subdirectory within images folder
 * @param progressCallback Optional callback to report progress
 * @returns URL path to the saved image
 */
export const saveImageLocally = async (
  file: File,
  subdirectory: string = 'products',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // Generate a unique filename to avoid collisions
    const timestamp = new Date().getTime();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${safeFileName}`;
    
    // Expected path where the image will be accessible
    const imagePath = `/images/${subdirectory}/${fileName}`;
    
    // In production, we would upload to a server API
    if (isProduction) {
      return await uploadToServerAPI(file, subdirectory, fileName, progressCallback);
    } 
    // In development, simulate local storage
    else {
      return await simulateLocalStorage(file, imagePath, progressCallback);
    }
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

/**
 * Upload a file to a server API endpoint
 * 
 * @param file File to upload
 * @param subdirectory Subdirectory for organization
 * @param fileName Name to save the file as
 * @param progressCallback Optional callback for progress updates
 * @returns URL path to the uploaded image
 */
async function uploadToServerAPI(
  file: File, 
  subdirectory: string,
  fileName: string,
  progressCallback?: (progress: number) => void
): Promise<string> {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subdirectory', subdirectory);
  formData.append('fileName', fileName);
  
  // Use the URL of your backend API
  // TODO: Replace with your actual API endpoint
  const uploadEndpoint = '/api/upload-image'; 
  
  try {
    // For browsers that support the Fetch API with upload progress
    if (window.XMLHttpRequest) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && progressCallback) {
            const progress = Math.round((event.loaded / event.total) * 100);
            progressCallback(progress);
          }
        });
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.imageUrl);
              } catch (error) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.open('POST', uploadEndpoint, true);
        xhr.send(formData);
      });
    } 
    // Fallback to fetch without progress reporting
    else {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.imageUrl;
    }
  } catch (error) {
    console.error('Error uploading to server:', error);
    throw new Error('Failed to upload image to server. Please try again.');
  }
}

/**
 * Simulate local storage in development environment
 * 
 * @param file File to "save"
 * @param imagePath Path where the image would be stored
 * @param progressCallback Optional callback for progress updates
 * @returns Path to the simulated saved image
 */
async function simulateLocalStorage(
  file: File,
  imagePath: string,
  progressCallback?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    // Create a preview URL for development purposes
    const reader = new FileReader();
    
    reader.onload = () => {
      // In development, we'll store the data URL in sessionStorage
      // This allows the image to be "saved" during the current session
      // Note: This is only for development and has size limitations
      try {
        if (typeof reader.result === 'string') {
          // Store the data URL in sessionStorage using the path as the key
          sessionStorage.setItem(`dev-image:${imagePath}`, reader.result);
          
          console.log(`DEV MODE: Image "saved" to session storage with key: dev-image:${imagePath}`);
          console.log('In production, you would need a server API to handle file uploads');
        }
      } catch (e) {
        console.warn('Session storage error (likely size exceeded):', e);
        // If sessionStorage fails (e.g., due to size limits), we still return the path
        // But the image won't actually be available
      }
    };
    
    // Simulate upload progress
    if (progressCallback) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        progressCallback(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve(imagePath);
        }
      }, 100);
    } else {
      // If no progress callback, resolve immediately
      reader.onloadend = () => resolve(imagePath);
    }
    
    // Start reading the file
    reader.readAsDataURL(file);
  });
}

/**
 * Delete an image file
 * 
 * @param imagePath Path of the image to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteLocalImage = async (imagePath: string): Promise<void> => {
  if (isProduction) {
    // In production, call the server API to delete the file
    try {
      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath }),
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image from server');
    }
  } else {
    // In development, remove from sessionStorage
    try {
      sessionStorage.removeItem(`dev-image:${imagePath}`);
      console.log(`DEV MODE: Image "deleted" from session storage: ${imagePath}`);
    } catch (e) {
      console.error('Error deleting from session storage:', e);
    }
  }
  
  return Promise.resolve();
};

/**
 * Get the actual image URL, handling both development and production cases
 * 
 * @param imagePath The stored path of the image
 * @returns The URL to use for displaying the image
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return it as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // For absolute paths starting with a slash, make sure they're properly handled
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  if (!isProduction) {
    // Try different potential keys for the session storage
    const potentialKeys = [
      `dev-image:${normalizedPath}`,
      `dev-image:${imagePath}`,
      `dev-image:/images/products/${imagePath.split('/').pop()}`,
    ];
    
    // Check if we have this image in sessionStorage under any of these keys
    for (const key of potentialKeys) {
      const storedImage = sessionStorage.getItem(key);
      if (storedImage) {
        console.log('Found image in session storage with key:', key);
        return storedImage;
      }
    }
    
    // If not found in session storage, log a warning
    console.warn('Image not found in session storage:', normalizedPath);
    console.log('Available keys in session storage:', 
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('dev-image:'))
        .join(', '));
  }
  
  // For production or fallback, construct the URL relative to the base URL
  const baseUrl = window.location.origin;
  return `${baseUrl}${normalizedPath}`;
};
