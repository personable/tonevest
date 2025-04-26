import type { IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Tag, DollarSign, Lightbulb, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react'; // Import icons

interface IdentificationResultProps {
  result: IdentifyPedalsOutput | null;
}

export function IdentificationResult({ result }: IdentificationResultProps) {
  if (!result || result.pedalIdentifications.length === 0) {
     // Display a message if the array is empty but the result object exists
     if (result && result.pedalIdentifications.length === 0) {
       return (
         <Card className="w-full shadow-md mt-6">
           <CardHeader>
             <CardTitle className="text-xl flex items-center gap-2">
                <Info className="w-5 h-5" /> Identification Result
             </CardTitle>
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
    if (score >= 0.8) return 'default'; // Primary color (usually blue)
    if (score >= 0.5) return 'outline'; // Outline style
    return 'destructive'; // Destructive color (red)
  };

  const getConfidenceLabel = (score: number | undefined) => {
    if (score === undefined) return 'Confidence Unknown';
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
   }

   const getAdviceIcon = (advice: string | undefined) => {
     switch (advice) {
       case 'Keep': return <ThumbsUp className="w-4 h-4 text-green-600" />;
       case 'Sell': return <ThumbsDown className="w-4 h-4 text-red-600" />;
       case 'Buy If Cheap': return <DollarSign className="w-4 h-4 text-blue-600" />;
       case 'Consider Selling': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
       default: return <Lightbulb className="w-4 h-4 text-muted-foreground" />;
     }
   };

   const getAdviceBadgeVariant = (advice: string | undefined) => {
    switch (advice) {
        case 'Keep': return 'default'; // Or a custom 'success' variant if defined
        case 'Sell': return 'destructive';
        case 'Buy If Cheap': return 'secondary'; // Use secondary for less strong advice
        case 'Consider Selling': return 'outline'; // Use outline for cautionary advice
        default: return 'secondary';
      }
   }

  return (
    <div className="space-y-4 mt-6">
       <h2 className="text-xl font-semibold text-center flex items-center justify-center gap-2">
         <Tag className="w-5 h-5" /> Identification Results
       </h2>
       {result.pedalIdentifications.map((pedal, index) => (
         <Card key={index} className="w-full shadow-sm border overflow-hidden">
           <CardHeader className="pb-2 pt-4 bg-muted/50">
             <CardTitle className="text-lg">Pedal #{index + 1}: {pedal.make} {pedal.model}</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3 p-4">
              {/* Confidence */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                   <Info className="w-4 h-4" /> Confidence:
                </span>
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
             <Separator/>

             {/* Estimated Price - Always render as it's required */}
             <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Used Price:
                </span>
               <span className="font-semibold">{pedal.estimatedUsedPrice}</span>
             </div>
              <Separator/>


              {/* Advice */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                   {getAdviceIcon(pedal.advice)} Advice:
                </span>
                 <Badge variant={getAdviceBadgeVariant(pedal.advice)} className="capitalize">
                     {pedal.advice || 'N/A'}
                 </Badge>
             </div>

              {/* Reasoning */}
               {pedal.reasoning && (
                 <>
                  <Separator/>
                  <div>
                      <span className="font-medium text-muted-foreground flex items-center gap-1 mb-1">
                          <Lightbulb className="w-4 h-4" /> Reasoning:
                      </span>
                     <p className="text-sm text-foreground/90 italic pl-2 border-l-2 border-border ml-2">{pedal.reasoning}</p>
                  </div>
                 </>
              )}
           </CardContent>
         </Card>
       ))}
    </div>
  );
}
