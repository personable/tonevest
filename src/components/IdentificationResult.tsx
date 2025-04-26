import type { IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Tag, DollarSign, Lightbulb, ThumbsUp, ThumbsDown, AlertTriangle, Building, Box, Sigma } from 'lucide-react'; // Added Sigma for total

interface IdentificationResultProps {
  result: IdentifyPedalsOutput | null;
}

// Helper function to parse price string and return a number or null
const parsePrice = (priceString: string): number | null => {
    if (!priceString || priceString.toLowerCase() === "price unknown") {
      return null;
    }

    // Remove non-numeric characters except '.' and '-' (for ranges) and potential spaces
    const cleanedString = priceString.replace(/[$,~]/g, '').trim();

    // Check for range format "X - Y"
    const rangeMatch = cleanedString.match(/^(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)$/);
    if (rangeMatch) {
      const lower = parseFloat(rangeMatch[1]);
      const upper = parseFloat(rangeMatch[3]);
      if (!isNaN(lower) && !isNaN(upper)) {
        return (lower + upper) / 2;
      }
    }

    // Check for single number format
    const singleMatch = cleanedString.match(/^(\d+(\.\d+)?)$/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      if (!isNaN(value)) {
        return value;
      }
    }

    console.warn(`Could not parse price string: "${priceString}"`); // Log unparsed strings
    return null; // Return null if parsing fails or format is unexpected
};


export function IdentificationResult({ result }: IdentificationResultProps) {
  if (!result || result.pedalIdentifications.length === 0) {
     // Display a message if the array is empty but the result object exists
     if (result && result.pedalIdentifications.length === 0) {
       return (
         <Card className="w-full shadow-md mt-6 border">
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

  // Calculate total price
  const totalPrice = result.pedalIdentifications.reduce((total, pedal) => {
    const price = parsePrice(pedal.estimatedUsedPrice);
    return total + (price || 0);
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
                        ${totalPrice.toFixed(2)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                    Based on average used prices. Excludes pedals with unknown prices.
                </p>
            </CardContent>
        </Card>

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

             {/* Estimated Price - Always render as it's required */}
             <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                  <DollarSign className="w-4 h-4" /> Used Price:
                </span>
               <span className="font-semibold">{pedal.estimatedUsedPrice}</span>
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
