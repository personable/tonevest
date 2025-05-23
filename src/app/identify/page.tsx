
'use client';

import * as React from 'react';
import Link from 'next/link'; // Import Link
import { identifyPedals } from '@/ai/flows/identify-pedal-from-image';
import type { IdentifyPedalsInput, IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageInput } from '@/components/ImageInput';
import { IdentificationResult } from '@/components/IdentificationResult';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Guitar, Camera, Upload, X, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image'; // Import next/image

type InputMode = 'upload' | 'camera';

export default function IdentifyPage() {
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
  const startCamera = React.useCallback(async () => {
    // Prevent starting if stream exists or not in camera mode
    if (streamRef.current || inputMode !== 'camera') {
       if (streamRef.current) setHasCameraPermission(true); // Assume permission if stream exists
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        // Ensure previous metadata listeners are removed if any
         videoRef.current.onloadedmetadata = null;

         videoRef.current.srcObject = stream;

         // Wait for metadata to load before attempting to play
         videoRef.current.onloadedmetadata = () => {
           videoRef.current?.play().catch(err => {
             console.error("Error playing video:", err.name, err.message);
             // Specifically handle AbortError which indicates interruption
             if (err.name === 'AbortError') {
               console.log("Video play() request was interrupted. This is often normal during navigation or stream changes.");
             } else if (err.name === 'NotAllowedError') {
               toast({
                 variant: 'destructive',
                 title: 'Autoplay Failed',
                 description: 'Camera started, but autoplay was prevented. You might need to interact with the page.',
               });
              } else {
                // Handle other potential errors
                toast({
                  variant: 'destructive',
                  title: 'Camera Error',
                  description: 'Could not play video stream.',
                });
              }
           });
         };
         // Handle potential errors during loading
         videoRef.current.onerror = () => {
           console.error("Error loading video stream.");
           toast({
              variant: 'destructive',
              title: 'Camera Load Error',
              description: 'Failed to load the video stream.',
           });
         };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      streamRef.current = null; // Ensure streamRef is null on error
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: error.name === 'NotAllowedError'
          ? 'Please enable camera permissions in your browser settings.'
          : `Could not access camera: ${error.message}`,
      });
    }
  }, [inputMode, toast]); // Dependencies for useCallback

  // Stop Camera Stream
  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Remove stream from video element
         // Remove event listeners to prevent memory leaks
         videoRef.current.onloadedmetadata = null;
         videoRef.current.onerror = null;
      }
      // Don't reset permission status here, just stop the stream
    }
  }, []); // No dependencies needed

  // Handle Mode Change
  React.useEffect(() => {
    if (inputMode === 'camera') {
      startCamera();
      setImageDataUri(null); // Clear uploaded image when switching to camera
      setIdentificationResult(null); // Clear results
    } else {
      stopCamera();
       setIdentificationResult(null); // Clear results
    }
    // Cleanup function to stop camera when component unmounts or mode changes
    return () => {
      stopCamera();
    };
  }, [inputMode, startCamera, stopCamera]); // Include start/stopCamera


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
        <CardHeader className="text-center bg-primary text-primary-foreground p-4 border-b border-border flex flex-row items-center justify-between">
            {/* Back Button */}
           <Link href="/" passHref>
             <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 h-8 w-8">
               <ArrowLeft className="h-5 w-5" />
               <span className="sr-only">Back to Home</span>
             </Button>
           </Link>
           {/* Centered Title Group */}
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 mb-1">
               <Guitar className="w-6 h-6" />
               <CardTitle className="text-2xl font-bold font-serif">Pedal Identifier</CardTitle>
             </div>
             <CardDescription className="text-primary-foreground/80 text-sm">
               Upload or capture a photo containing guitar pedals.
             </CardDescription>
           </div>
           {/* Placeholder for potential right-side element, ensuring centering */}
           <div className="w-8"></div>
        </CardHeader>
        {/* Added flex-grow to allow content to expand */}
        <CardContent className="p-4 sm:p-6 space-y-4 flex-grow overflow-y-auto">

          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" />Use Camera</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload Photo</TabsTrigger>
            </TabsList>

            {/* Camera Tab */}
            <TabsContent value="camera" className="mt-4 space-y-4">
              {/* Adjusted video container styling */}
              <div className="relative aspect-video w-full bg-muted rounded-none overflow-hidden border">
                {/* Video tag is always present */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${hasCameraPermission === false ? 'hidden' : ''}`} // Hide visually if no permission, but keep in DOM
                  autoPlay // Autoplay is often desired, but might be blocked by browser
                  playsInline // Important for iOS
                  muted // Mute is necessary for autoplay without user interaction
                />
                 {/* Overlay for permission status */}
                 {hasCameraPermission === null && inputMode === 'camera' && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                     Requesting camera access...
                   </div>
                 )}
                 {/* Display permission denied message only if permission is false */}
                 {hasCameraPermission === false && inputMode === 'camera' && (
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
                       fill // Use fill and objectFit for responsiveness
                       objectFit="contain" // Contain ensures the whole image is visible
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
              {hasCameraPermission === false && inputMode === 'camera' && (
                 <Alert variant="destructive" className="rounded-none"> {/* Removed rounded corners */}
                   <AlertTitle>Camera Access Required</AlertTitle>
                   <AlertDescription>
                     Please allow camera access in your browser settings to use this feature. You may need to refresh the page after granting permission.
                   </AlertDescription>
                 </Alert>
               )}

              {/* Show capture button only if permission granted and no image captured yet */}
              {hasCameraPermission === true && !imageDataUri && inputMode === 'camera' && (
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


            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-4">
              <ImageInput
                onImageChange={setImageDataUri}
                currentImage={imageDataUri} // Pass current image for preview consistency
                onClear={handleClearImage} // Pass clear handler
              />
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
