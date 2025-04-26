
'use client';

import * as React from 'react';
import { identifyPedals } from '@/ai/flows/identify-pedal-from-image';
import type { IdentifyPedalsInput, IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageInput } from '@/components/ImageInput';
import { IdentificationResult } from '@/components/IdentificationResult';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Guitar, Camera, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image'; // Import next/image

type InputMode = 'upload' | 'camera';

export default function Home() {
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = React.useState<IdentifyPedalsOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  // Change default input mode to 'camera'
  const [inputMode, setInputMode] = React.useState<InputMode>('camera');
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null); // null initially, true/false after check
  const [isCapturing, setIsCapturing] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null); // Ref for canvas element

  const { toast } = useToast();

  // Request Camera Permission and Start Stream
  const startCamera = async () => {
    if (streamRef.current) {
      // Camera already running
      setHasCameraPermission(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays when stream is set and component is mounted
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      streamRef.current = null; // Ensure streamRef is null on error
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this feature.',
      });
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Remove stream from video element
      }
      // Don't reset permission status here, just stop the stream
    }
  };

  // Handle Mode Change
  React.useEffect(() => {
    if (inputMode === 'camera') {
      startCamera();
      setImageDataUri(null); // Clear uploaded image when switching to camera
      setIdentificationResult(null); // Clear results
    } else {
      stopCamera();
       // Optionally clear captured image when switching to upload
       // setImageDataUri(null);
       setIdentificationResult(null); // Clear results
    }
    // Cleanup function to stop camera when component unmounts or mode changes
    return () => {
      stopCamera();
    };
  }, [inputMode]);


  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas'); // Use document.createElement
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg'); // Or 'image/png'
      setImageDataUri(dataUri);
      // Stop camera after capture
      stopCamera();
       setIdentificationResult(null); // Clear previous results when capturing new image
    } else {
      console.error('Could not get canvas context');
      toast({
        title: 'Capture Failed',
        description: 'Could not capture image from camera.',
        variant: 'destructive',
      });
    }
    setIsCapturing(false);
  };

  const handleClearImage = () => {
    setImageDataUri(null);
    setIdentificationResult(null); // Clear results when image is cleared
    // If in camera mode and camera was stopped by capture, restart it
    if (inputMode === 'camera' && !streamRef.current && hasCameraPermission === true) {
      startCamera();
    }
  };


  const handleIdentify = async () => {
    if (!imageDataUri) {
      toast({
        title: 'No Image Available',
        description: inputMode === 'upload' ? 'Please upload an image first.' : 'Please capture a photo first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setIdentificationResult(null); // Clear previous results

    try {
      const input: IdentifyPedalsInput = { photoDataUri: imageDataUri };
      const result = await identifyPedals(input);
      setIdentificationResult(result);

      const count = result.pedalIdentifications.length;
      toast({
        title: 'Identification Complete',
        description: count > 0
          ? `Identified ${count} pedal${count > 1 ? 's' : ''}.`
          : 'No pedals identified in the image.',
      });
    } catch (error) {
      console.error('Error identifying pedals:', error);
      toast({
        title: 'Identification Failed',
        description: 'Could not identify pedals. Please try another image or check the console.',
        variant: 'destructive',
      });
       setIdentificationResult(null); // Ensure result is cleared on error
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = identificationResult && identificationResult.pedalIdentifications.length > 0;

  return (
    // Updated main container for full screen and simplified background
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      {/* Removed max-w-lg and shadow-xl, adjusted layout */}
      <Card className="w-full h-full flex flex-col border-0 rounded-none">
        <CardHeader className="text-center bg-primary text-primary-foreground p-4 border-b border-border">
           <div className="flex justify-center items-center gap-2 mb-1">
             <Guitar className="w-6 h-6" />
             <CardTitle className="text-2xl font-bold font-serif">Pedal Identifier</CardTitle>
           </div>
          <CardDescription className="text-primary-foreground/80 text-sm">
            Upload or capture a photo containing guitar pedals.
          </CardDescription>
        </CardHeader>
        {/* Added flex-grow to allow content to expand */}
        <CardContent className="p-4 sm:p-6 space-y-4 flex-grow overflow-y-auto">

          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload Photo</TabsTrigger>
              <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" />Use Camera</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-4">
              <ImageInput
                onImageChange={setImageDataUri}
                currentImage={imageDataUri} // Pass current image for preview consistency
                onClear={handleClearImage} // Pass clear handler
              />
            </TabsContent>

            {/* Camera Tab */}
            <TabsContent value="camera" className="mt-4 space-y-4">
              {/* Adjusted video container styling */}
              <div className="relative aspect-video w-full bg-muted rounded-none overflow-hidden border">
                {/* Video tag is always present */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${hasCameraPermission === false ? 'hidden' : ''}`} // Hide visually if no permission, but keep in DOM
                  autoPlay
                  playsInline // Important for iOS
                  muted // Mute to avoid feedback loops
                />
                 {/* Overlay for permission status */}
                 {hasCameraPermission === null && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                     Requesting camera access...
                   </div>
                 )}
                 {/* Display permission denied message only if permission is false */}
                 {hasCameraPermission === false && (
                   <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-destructive-foreground p-4 text-center">
                     Camera access denied. Please enable in browser settings.
                   </div>
                 )}
                 {/* Show captured image preview */}
                 {imageDataUri && inputMode === 'camera' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                     <Image
                       src={imageDataUri}
                       alt="Captured pedal"
                       layout="fill"
                       objectFit="contain"
                       className="rounded-none" // Removed rounded corners
                     />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-white bg-black/50 hover:bg-black/70 rounded-none" // Removed rounded corners
                      onClick={handleClearImage}
                      aria-label="Clear captured photo"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                 )}
              </div>

              {/* Show permission denied alert below video */}
              {hasCameraPermission === false && (
                 <Alert variant="destructive" className="rounded-none"> {/* Removed rounded corners */}
                   <AlertTitle>Camera Access Required</AlertTitle>
                   <AlertDescription>
                     Please allow camera access in your browser settings to use this feature. You may need to refresh the page after granting permission.
                   </AlertDescription>
                 </Alert>
               )}

              {/* Show capture button only if permission granted and no image captured yet */}
              {hasCameraPermission === true && !imageDataUri && (
                <Button
                  onClick={handleCapture}
                  disabled={isCapturing || !streamRef.current}
                  className="w-full rounded-none" // Removed rounded corners
                  variant="secondary"
                >
                  {isCapturing ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" /> Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" /> Capture Photo
                    </>
                  )}
                </Button>
              )}
            </TabsContent>
          </Tabs>


          <Button
            onClick={handleIdentify}
            disabled={!imageDataUri || isLoading}
            // Updated button styling: Use accent color, remove shadow, remove rounded corners
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-none transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-5 w-5" />
                Identifying...
              </>
            ) : (
              'Identify Pedals'
            )}
          </Button>

          {identificationResult && !isLoading && (
             <IdentificationResult result={identificationResult} />
          )}

          {!isLoading && !identificationResult && imageDataUri && (
             <div className="text-center text-muted-foreground p-4 border border-dashed rounded-none"> {/* Removed rounded corners */}
               Ready to identify. Click the button above!
             </div>
           )}

        </CardContent>
      </Card>
       <footer className="mt-4 text-center text-xs text-muted-foreground">
         Powered by Genkit AI
       </footer>
    </main>
  );
}
