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
}

export function ImageInput({ onImageChange, className }: ImageInputProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFileName(file.name);
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    } else {
      handleClear();
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setFileName(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary transition-colors duration-200 ease-in-out',
          imagePreview ? 'border-solid p-4' : 'p-6'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Selected pedal"
              width={200}
              height={200}
              className="object-contain max-h-full max-w-full rounded-md"
              style={{ maxWidth: '100%', maxHeight: 'calc(100% - 2.5rem)' }} // Ensure image fits within container
            />
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              <span className="truncate mr-2">{fileName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering file input click
                  handleClear();
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear image</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-2" />
            <Label htmlFor="file-upload" className="text-center">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
            </Label>
          </>
        )}
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          className="sr-only"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
