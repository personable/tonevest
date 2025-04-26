
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
  const [inputMode, setInputMode] = React.useState<InputMode>('upload');
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
      }
      // Ensure video plays when stream is set
      if (videoRef.current && videoRef.current.paused) {
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
           <div className="flex justify-center items-center gap-2 mb-2">
             <Guitar className="w-8 h-8" />
             <CardTitle className="text-3xl font-bold font-serif">Pedal Identifier</CardTitle>
           </div>
          <CardDescription className="text-primary-foreground/80">
            Upload or capture a photo containing guitar pedals!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

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
              <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
                {/* Show video only if permission is granted or pending */}
                {hasCameraPermission !== false && (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline // Important for iOS
                    muted // Mute to avoid feedback loops
                  />
                )}
                {/* Overlay for permission status */}
                {hasCameraPermission === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    Requesting camera access...
                  </div>
                )}
                {hasCameraPermission === false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-destructive-foreground p-4">
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
                       className="rounded-md"
                     />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-white bg-black/50 hover:bg-black/70"
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
                 <Alert variant="destructive">
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
                  className="w-full"
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
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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
             <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
               Ready to identify. Click the button above!
             </div>
           )}

        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
         Powered by Genkit AI
       </footer>
    </main>
  );
}
        
      