import type { IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator'; // Import Separator

interface IdentificationResultProps {
  result: IdentifyPedalsOutput | null;
}

export function IdentificationResult({ result }: IdentificationResultProps) {
  if (!result || result.pedalIdentifications.length === 0) {
     // Display a message if the array is empty but the result object exists
     if (result && result.pedalIdentifications.length === 0) {
       return (
         <Card className="w-full shadow-md">
           <CardHeader>
             <CardTitle className="text-xl">Identification Result</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">No pedals were identified in the image.</p>
           </CardContent>
         </Card>
       );
     }
    return null; // Return null if result itself is null
  }

  const getConfidenceBadgeVariant = (score: number | undefined) => {
    if (score === undefined) return 'secondary';
    if (score >= 0.8) return 'default';
    if (score >= 0.5) return 'outline';
    return 'destructive';
  };

  const getConfidenceLabel = (score: number | undefined) => {
    if (score === undefined) return 'Confidence Unknown';
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
   }

  return (
    <div className="space-y-4">
       <h2 className="text-xl font-semibold text-center">Identification Results</h2>
       {result.pedalIdentifications.map((pedal, index) => (
         <Card key={index} className="w-full shadow-sm border">
           <CardHeader className="pb-2 pt-4">
              {/* Add a title for each pedal card */}
             <CardTitle className="text-lg">Pedal #{index + 1}</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3 pt-2 pb-4">
             <div className="flex justify-between items-center">
               <span className="font-medium text-muted-foreground">Make:</span>
               <span className="font-semibold">{pedal.make || 'N/A'}</span>
             </div>
             <Separator/>
             <div className="flex justify-between items-center">
               <span className="font-medium text-muted-foreground">Model:</span>
               <span className="font-semibold">{pedal.model || 'N/A'}</span>
             </div>
              <Separator/>
             <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Confidence:</span>
               {pedal.confidence !== undefined ? (
                 <Badge variant={getConfidenceBadgeVariant(pedal.confidence)}>
                   {getConfidenceLabel(pedal.confidence)} ({(pedal.confidence * 100).toFixed(0)}%)
                 </Badge>
               ) : (
                 <Badge variant="secondary">
                   Not Specified
                 </Badge>
               )}
             </div>
           </CardContent>
         </Card>
       ))}
    </div>
  );
}
