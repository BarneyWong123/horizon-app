import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

const ImageUploader = ({ onUpload, disabled }) => {
    const [preview, setPreview] = useState(null);

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        setPreview(URL.createObjectURL(file));
        try {
            const base64 = await convertToBase64(file);
            await onUpload(base64);
        } catch (err) {
            console.error(err);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        if (disabled) return;
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed border-slate-800' : 'border-slate-700 hover:border-brand-emerald'
                    }`}
                onClick={() => !disabled && document.getElementById('fileInput').click()}
            >
                <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files[0])}
                    disabled={disabled}
                />

                {preview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <img src={preview} alt="Receipt preview" className="w-full h-full object-cover" />
                        <button
                            onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/80 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-slate-500 mb-2" />
                        <p className="text-slate-400 text-sm">Drag & drop receipt image or click to browse</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;
