import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  uploadString,
  uploadBytesResumable
} from 'firebase/storage';
import { storage } from './config';

// Define folder paths for different entity types
export const STORAGE_PATHS = {
  PRODUCTS: 'products',
  BLOGS: 'blogs',
  USERS: 'users',
  TEMP: 'temp',
  CONTACT_ATTACHMENTS: 'contact-attachments'
};

/**
 * Upload a file to Firebase Storage
 * @param file File to upload
 * @param path Storage path where the file should be stored
 * @param fileName Optional custom file name (will use file.name if not provided)
 * @param progressCallback Optional callback function to report upload progress (0-100)
 * @returns Download URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string,
  progressCallback?: (progress: number) => void
): Promise<string> => {
  const storagePath = `${path}/${fileName || file.name}`;
  const storageRef = ref(storage, storagePath);
  
  if (progressCallback) {
    // Use resumable upload to track progress
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } else {
    // Use simple upload if no progress tracking needed
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }
};

/**
 * Upload a base64 image string to Firebase Storage
 * @param base64String Base64 string representation of image (with or without data URL prefix)
 * @param path Storage path where the file should be stored
 * @param fileName File name to use for the uploaded image
 * @returns Download URL of the uploaded file
 */
export const uploadBase64Image = async (
  base64String: string,
  path: string,
  fileName: string
): Promise<string> => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes('base64,') 
    ? base64String.split('base64,')[1] 
    : base64String;
  
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  // Upload base64 string
  const snapshot = await uploadString(storageRef, base64Data, 'base64');
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl URL of the file to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const decodedUrl = decodeURIComponent(fileUrl);
    const startIndex = decodedUrl.indexOf('o/') + 2;
    const endIndex = decodedUrl.indexOf('?');
    const filePath = decodedUrl.substring(startIndex, endIndex);
    
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param path Storage path to list files from
 * @returns Array of download URLs for all files in the directory
 */
export const listFiles = async (path: string): Promise<string[]> => {
  const directoryRef = ref(storage, path);
  const listResult = await listAll(directoryRef);
  
  const downloadURLs = await Promise.all(
    listResult.items.map(item => getDownloadURL(item))
  );
  
  return downloadURLs;
};

/**
 * Upload a product image and return the download URL
 * @param file Image file to upload
 * @param fileName Name to use for the file
 * @param progressCallback Optional callback function to report upload progress (0-100)
 * @returns Download URL of the uploaded image
 */
export const uploadProductImage = async (
  file: File,
  fileName: string,
  progressCallback?: (progress: number) => void
): Promise<string> => {
  return uploadFile(file, STORAGE_PATHS.PRODUCTS, fileName, progressCallback);
};

/**
 * Upload a blog image and return the download URL
 * @param file Image file to upload
 * @param blogId ID of the blog post
 * @returns Download URL of the uploaded image
 */
export const uploadBlogImage = async (
  file: File,
  blogId: string
): Promise<string> => {
  return uploadFile(file, `${STORAGE_PATHS.BLOGS}/${blogId}`, file.name);
};

/**
 * Upload a user avatar and return the download URL
 * @param file Image file to upload
 * @param userId ID of the user
 * @returns Download URL of the uploaded image
 */
export const uploadUserAvatar = async (
  file: File,
  userId: string
): Promise<string> => {
  return uploadFile(file, `${STORAGE_PATHS.USERS}/${userId}`, 'avatar');
};

/**
 * Upload a contact form attachment and return the download URL
 * @param file File to upload
 * @param contactId ID of the contact submission
 * @returns Download URL of the uploaded file
 */
export const uploadContactAttachment = async (
  file: File,
  contactId: string
): Promise<string> => {
  return uploadFile(file, `${STORAGE_PATHS.CONTACT_ATTACHMENTS}/${contactId}`, file.name);
};
