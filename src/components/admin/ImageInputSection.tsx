import React from 'react';

interface ImageInputSectionProps {
  imageInputType: 'url' | 'file';
  setImageInputType: (type: 'url' | 'file') => void;
  formData: { image?: string };
  setFormData: (data: any) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageInputSection: React.FC<ImageInputSectionProps> = ({
  imageInputType,
  setImageInputType,
  formData,
  setFormData,
  previewUrl,
  setPreviewUrl,
  imageFile,
  setImageFile,
  fileInputRef,
  handleImageChange,
}) => {
  // Handle image URL input
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setPreviewUrl(url);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">Featured Image</label>
      
      {/* Toggle between URL and file upload */}
      <div className="flex mb-2">
        <button
          type="button"
          onClick={() => setImageInputType('url')}
          className={`mr-2 px-3 py-1 rounded-l ${imageInputType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Image URL
        </button>
        <button
          type="button"
          onClick={() => setImageInputType('file')}
          className={`px-3 py-1 rounded-r ${imageInputType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Upload File
        </button>
      </div>
      
      {/* URL input */}
      {imageInputType === 'url' && (
        <input
          type="url"
          placeholder="Enter image URL"
          value={formData.image || ''}
          onChange={handleImageUrlChange}
          className="w-full border rounded-md px-3 py-2 mb-2"
        />
      )}
      
      {/* File upload */}
      {imageInputType === 'file' && (
        <>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded mb-2"
          >
            {imageFile ? 'Change Image' : 'Select Image'}
          </button>
        </>
      )}
      
      {/* Image preview */}
      {previewUrl && (
        <div className="mt-2">
          <img src={previewUrl} alt="Preview" className="max-h-40 rounded" />
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              setImageFile(null);
              setFormData({ ...formData, image: '' });
            }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs mt-1"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageInputSection;
