'use client';

import * as React from 'react';
import { identifyPedal } from '@/ai/flows/identify-pedal-from-image';
import type { IdentifyPedalInput, IdentifyPedalOutput } from '@/ai/flows/identify-pedal-from-image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageInput } from '@/components/ImageInput';
import { IdentificationResult } from '@/components/IdentificationResult';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Guitar } from 'lucide-react';

export default function Home() {
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = React.useState<IdentifyPedalOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleIdentify = async () => {
    if (!imageDataUri) {
      toast({
        title: 'No Image Selected',
        description: 'Please upload or select an image first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setIdentificationResult(null); // Clear previous results

    try {
      const input: IdentifyPedalInput = { photoDataUri: imageDataUri };
      const result = await identifyPedal(input);
      setIdentificationResult(result);
      toast({
        title: 'Identification Complete',
        description: `Identified as ${result.pedalIdentification.make} ${result.pedalIdentification.model}.`,
      });
    } catch (error) {
      console.error('Error identifying pedal:', error);
      toast({
        title: 'Identification Failed',
        description: 'Could not identify the pedal. Please try another image.',
        variant: 'destructive',
      });
       setIdentificationResult(null); // Ensure result is cleared on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-6">
           <div className="flex justify-center items-center gap-2 mb-2">
             <Guitar className="w-8 h-8" />
             <CardTitle className="text-3xl font-bold">Pedal Identifier</CardTitle>
           </div>
          <CardDescription className="text-primary-foreground/80">
            Upload a photo of a guitar pedal and let AI identify it!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <ImageInput onImageChange={setImageDataUri} />

          <Button
            onClick={handleIdentify}
            disabled={!imageDataUri || isLoading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 rounded-lg shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            aria-live="polite" // Announce loading state changes
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-5 w-5" />
                Identifying...
              </>
            ) : (
              'Identify Pedal'
            )}
          </Button>

          {/* Display Result Section */}
          {identificationResult && !isLoading && (
             <IdentificationResult result={identificationResult} />
          )}

          {/* Optional: Placeholder or message when no result and not loading */}
          {!isLoading && !identificationResult && imageDataUri && (
            <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
               Click "Identify Pedal" to see the results.
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
