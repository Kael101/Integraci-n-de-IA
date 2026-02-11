import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const ImageUploader = ({ onImageSelected, label = "Subir Imagen" }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const previewUrl = URL.createObjectURL(compressedFile);

            setPreview(previewUrl);
            onImageSelected(compressedFile); // Pass the compressed file up
        } catch (error) {
            console.error('Error compressing image:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelected(null);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                {label}
            </label>

            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id={`image-upload-${label.replace(/\s+/g, '-')}`}
                />

                <label
                    htmlFor={`image-upload-${label.replace(/\s+/g, '-')}`}
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${preview ? 'border-jaguar-500' : 'border-gray-600'}`}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jaguar-400"></div>
                    ) : preview ? (
                        <div className="relative w-full h-full">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pt-5 pb-6 text-gray-400">
                            <Upload size={32} className="mb-2" />
                            <p className="text-sm">Click para subir imagen</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG (Max. 5MB)</p>
                        </div>
                    )}
                </label>
            </div>
        </div>
    );
};

export default ImageUploader;
