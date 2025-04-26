import type { IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Tag, DollarSign, Lightbulb, ThumbsUp, ThumbsDown, AlertTriangle, Building, Box, Sigma, MessageSquareQuote } from 'lucide-react'; // Added Sigma, MessageSquareQuote

interface IdentificationResultProps {
  result: IdentifyPedalsOutput | null;
}

export function IdentificationResult({ result }: IdentificationResultProps) {
  // Early exit if result is null
  if (!result) {
    return null;
  }

  // Handle case where no pedals were identified, but assessment might still exist
  if (result.pedalIdentifications.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        <Card className="w-full shadow-md border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="w-5 h-5" /> Identification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No pedals were identified in the image.</p>
          </CardContent>
        </Card>
        {/* Display overall assessment even if no pedals are found */}
        {result.overallAssessment && (
           <Card className="w-full shadow-md border bg-muted/20">
             <CardHeader className="pb-2 pt-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <MessageSquareQuote className="w-5 h-5 text-primary" /> Overall Assessment
               </CardTitle>
             </CardHeader>
             <CardContent className="pb-3">
               <p className="text-sm text-foreground/90 italic">{result.overallAssessment}</p>
             </CardContent>
           </Card>
        )}
      </div>
    );
  }

  // Calculate total price using the number field directly
  const totalPrice = result.pedalIdentifications.reduce((total, pedal) => {
    // Add the price if it's a valid number (not null)
    return total + (pedal.estimatedUsedPrice ?? 0);
  }, 0);

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

   // Helper to format price
   const formatPrice = (price: number | null): string => {
     if (price === null) {
       return "Price Unknown";
     }
     // Format as currency, e.g., $62.50
     return `$${price.toFixed(2)}`;
   };

  return (
    <div className="space-y-4 mt-6">
       <h2 className="text-xl font-semibold text-center flex items-center justify-center gap-2 mb-4">
         <Tag className="w-5 h-5" /> Identification Results
       </h2>

        {/* Total Price Display */}
        <Card className="w-full shadow-md border bg-muted/30">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg flex items-center gap-2">
                        <Sigma className="w-5 h-5 text-primary" /> Total Estimated Value:
                    </span>
                    <span className="text-xl font-bold text-primary">
                        {formatPrice(totalPrice)} {/* Use the formatter */}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                    Based on estimated used prices. Excludes pedals with unknown prices.
                </p>
            </CardContent>
        </Card>

       {/* Overall Assessment Display */}
       {result.overallAssessment && (
         <Card className="w-full shadow-md border bg-muted/20">
           <CardHeader className="pb-2 pt-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <MessageSquareQuote className="w-5 h-5 text-primary" /> Overall Assessment
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-3">
             <p className="text-sm text-foreground/90 italic">{result.overallAssessment}</p>
           </CardContent>
         </Card>
       )}


        <Separator />

       {result.pedalIdentifications.map((pedal, index) => (
         <Card key={index} className="w-full shadow-sm border overflow-hidden">
           <CardHeader className="pb-3 pt-4 bg-muted/50">
             {/* Display Make and Model Separately */}
             <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" /> {pedal.make || 'Unknown Make'}
             </CardTitle>
             <CardDescription className="flex items-center gap-2 pt-1">
                <Box className="w-4 h-4 text-muted-foreground"/> {pedal.model || 'Unknown Model'}
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-3 p-4">
              {/* Confidence */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
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

             {/* Estimated Price - Display formatted price or "Price Unknown" */}
             <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                  <DollarSign className="w-4 h-4" /> Used Price:
                </span>
               <span className="font-semibold">{formatPrice(pedal.estimatedUsedPrice)}</span>
             </div>
              <Separator/>


              {/* Advice */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
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
                      <span className="font-medium text-muted-foreground flex items-center gap-1 mb-1 text-sm">
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
