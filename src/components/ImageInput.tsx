
'use client';

import * as React from 'react';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ImageInputProps {
  onImageChange: (imageDataUri: string | null) => void;
  className?: string;
  currentImage?: string | null; // New prop to display an existing image (e.g., from camera capture)
  onClear?: () => void; // Optional handler for external clear actions
}

export function ImageInput({ onImageChange, className, currentImage, onClear }: ImageInputProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update preview if currentImage prop changes (e.g., from camera)
  React.useEffect(() => {
    setImagePreview(currentImage || null);
    if (!currentImage) {
      setFileName(null); // Clear filename if external image is cleared
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Also clear the file input
      }
    }
    // We don't need to set a file name for captured images
  }, [currentImage]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFileName(file.name);
        onImageChange(result); // Notify parent about the new image
      };
      reader.readAsDataURL(file);
    } else {
      handleInternalClear(); // Use internal clear if file selection is cancelled
    }
  };

  // Internal clear function, also calls the external onClear if provided
  const handleInternalClear = () => {
    setImagePreview(null);
    setFileName(null);
    onImageChange(null); // Notify parent that image is cleared
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    onClear?.(); // Call external clear handler if it exists
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          // Updated styling: remove rounded corners
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-none cursor-pointer border-border hover:border-primary transition-colors duration-200 ease-in-out',
          imagePreview ? 'border-solid p-4' : 'p-6' // Keep padding when preview is shown
        )}
        onClick={() => fileInputRef.current?.click()}
        role="button" // Add role for accessibility
        tabIndex={0} // Make it focusable
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }} // Trigger click on Enter/Space
      >
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt={fileName ? `Selected: ${fileName}` : "Selected image preview"} // Improve alt text
              width={200} // Consider using layout="fill" and objectFit="contain" for responsiveness
              height={200}
              className="object-contain max-h-full max-w-full rounded-none" // Removed rounded corners
              style={{ maxWidth: '100%', maxHeight: 'calc(100% - 2.5rem)' }} // Ensure image fits
            />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-none"> {/* Removed rounded corners */}
              <span className="truncate mr-2">{fileName || 'Preview'}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-none" // Removed rounded corners
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering file input click
                  handleInternalClear();
                }}
                aria-label="Clear selected image" // Improve accessibility
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" aria-hidden="true" />
            {/* Use aria-labelledby or aria-describedby if needed */}
            <Label htmlFor="file-upload" className="text-center cursor-pointer">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF accepted</p>
            </Label>
          </>
        )}
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          className="sr-only" // Keep hidden
          accept="image/png, image/jpeg, image/gif" // Be specific about accepted types
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
