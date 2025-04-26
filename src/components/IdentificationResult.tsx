
import type { IdentifyPedalsOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Tag, DollarSign, Lightbulb, ThumbsUp, ThumbsDown, AlertTriangle, Building, Box, Sigma, MessageSquareQuote, BarChartHorizontalBig } from 'lucide-react'; // Added BarChartHorizontalBig
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, TooltipPayload } from 'recharts'; // Import recharts components
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"; // Import chart components

interface IdentificationResultProps {
  result: IdentifyPedalsOutput | null;
}

export function IdentificationResult({ result }: IdentificationResultProps) {
  // Early exit if result is null
  if (!result) {
    return null;
  }

  // Handle case where no pedals were identified
  if (result.pedalIdentifications.length === 0) {
    return (
      <div className="space-y-4 mt-6">
        {/* Removed shadow, adjusted styling */}
        <Card className="w-full border rounded-none">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 font-serif">
              <Info className="w-5 h-5" /> Identification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No pedals were identified in the image.</p>
          </CardContent>
        </Card>
        {/* Overall Assessment is intentionally removed here when no pedals are found */}
      </div>
    );
  }

  // Calculate total price using the number field directly
  const totalPrice = result.pedalIdentifications.reduce((total, pedal) => {
    // Add the price if it's a valid number (not null)
    return total + (pedal.estimatedUsedPrice ?? 0);
  }, 0);

  // Group pedals by manufacturer and sum their prices
  const manufacturerData = result.pedalIdentifications.reduce((acc, pedal) => {
    const make = pedal.make || 'Unknown';
    const price = pedal.estimatedUsedPrice ?? 0;
    acc[make] = (acc[make] || 0) + price;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for the bar chart
  const chartData = Object.entries(manufacturerData)
    .map(([make, value], index) => ({ // Added index parameter
      make,
      value,
      // Calculate percentage only if totalPrice is not zero
      percentage: totalPrice > 0 ? Math.round((value / totalPrice) * 100) : 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))` // Use index from map for chart colors
    }))
    .filter(item => item.value > 0) // Filter out manufacturers with zero value
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Define chart configuration for tooltips and colors using updated theme
  const chartConfig = chartData.reduce((acc, item, index) => {
    // Use the final index *after sorting* for consistent color assignment
    acc[item.make] = {
      label: item.make,
      color: `hsl(var(--chart-${(index % 5) + 1}))`, // Use updated chart colors
    };
    return acc;
  }, {} as ChartConfig);


  const getConfidenceBadgeVariant = (score: number | undefined) => {
    if (score === undefined) return 'secondary';
    if (score >= 0.8) return 'default'; // Use default (primary) for high confidence
    if (score >= 0.5) return 'outline';
    return 'destructive';
  };

  const getConfidenceLabel = (score: number | undefined) => {
    if (score === undefined) return 'Confidence Unknown';
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
   }

   // Using accent color for positive advice, neutral for others
   const getAdviceIcon = (advice: string | undefined) => {
     switch (advice) {
       case 'Keep': return <ThumbsUp className="w-4 h-4 text-accent" />; // Use accent color
       case 'Sell': return <ThumbsDown className="w-4 h-4 text-destructive" />;
       case 'Buy If Cheap': return <DollarSign className="w-4 h-4 text-primary" />; // Use primary color
       case 'Consider Selling': return <AlertTriangle className="w-4 h-4 text-yellow-600" />; // Keep warning color
       default: return <Lightbulb className="w-4 h-4 text-muted-foreground" />;
     }
   };

   // Adjusted badge variants for the new theme
   const getAdviceBadgeVariant = (advice: string | undefined) => {
    switch (advice) {
        case 'Keep': return 'default'; // Primary badge
        case 'Sell': return 'destructive';
        case 'Buy If Cheap': return 'secondary';
        case 'Consider Selling': return 'outline';
        default: return 'secondary';
      }
   }

   // Helper to format price - Added check for undefined
   const formatPrice = (price: number | null | undefined): string => {
     if (price === null || price === undefined) {
       return "Price Unknown";
     }
     // Format as currency, e.g., $62.50
     return `$${price.toFixed(2)}`;
   };

    // Custom Tooltip Formatter
    const customTooltipFormatter = (
        value: number, // This is the 'percentage' value from the Bar dataKey
        name: string, // This is the dataKey name ('percentage')
        item: TooltipPayload<number, string>, // The payload object for the specific item
        index: number,
        payload: TooltipPayload<number, string>[] // Full payload array
    ) => {
        // Access the 'make' from the payload item
        const make = item?.payload?.make;
        if (!make) return null; // Should not happen if data is correct

        // Look up the actual price from manufacturerData using the 'make'
        const actualPrice = manufacturerData[make];

        return (
            // Use card styling for tooltip
            <div className="flex flex-col gap-0.5 p-2 bg-card text-card-foreground border rounded-none">
                <span className="font-medium">{make}</span>
                <span className="text-muted-foreground">
                    {value}% ({formatPrice(actualPrice)})
                </span>
            </div>
        );
    };

  return (
    <div className="space-y-4 mt-6">
       <h2 className="text-xl font-semibold text-center flex items-center justify-center gap-2 mb-4 font-serif">
         <Tag className="w-5 h-5" /> Identification Results
       </h2>

        {/* Total Price Display - Updated styling */}
        <Card className="w-full border rounded-none bg-muted/30">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg flex items-center gap-2 font-serif">
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

       {/* Overall Assessment Display - Updated styling */}
       {result.overallAssessment && (
         <Card className="w-full border rounded-none bg-muted/20">
           <CardHeader className="pb-2 pt-3">
             <CardTitle className="text-lg flex items-center gap-2 font-serif">
               <MessageSquareQuote className="w-5 h-5 text-primary" /> Overall Assessment
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-3">
             <p className="text-sm text-foreground/90 italic">{result.overallAssessment}</p>
           </CardContent>
         </Card>
       )}

       {/* Manufacturer Value Distribution Chart - Updated styling */}
       {chartData.length > 0 && totalPrice > 0 && (
          <Card className="w-full border rounded-none">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-lg flex items-center gap-2 font-serif">
                <BarChartHorizontalBig className="w-5 h-5 text-primary" /> Manufacturer Value Distribution
              </CardTitle>
              <CardDescription>Percentage of total value by manufacturer</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                   {/* Use the generated chartData with fill property */}
                   <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                     <CartesianGrid horizontal={false} stroke="hsl(var(--border))" /> {/* Use border color */}
                     <XAxis type="number" dataKey="percentage" unit="%" hide />
                     <YAxis
                       dataKey="make"
                       type="category"
                       tickLine={false}
                       axisLine={false}
                       tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} // Use foreground color
                       width={80} // Adjust width as needed
                     />
                     <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={<ChartTooltipContent
                            formatter={customTooltipFormatter} // Use the custom formatter
                            indicator="dot"
                            // Use default tooltip styling defined in the component
                        />}
                      />
                     {/* Use the 'fill' property already assigned in chartData */}
                     <Bar dataKey="percentage" radius={0}> {/* Remove radius for sharp corners */}
                        {/* Use the index-based fill from chartData */}
                        {chartData.map((entry, index) => (
                           <LabelList key={`label-${index}`} dataKey="percentage" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value: number) => `${value}%`} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
       )}


        <Separator />

       {result.pedalIdentifications.map((pedal, index) => (
         // Updated card styling for individual pedals
         <Card key={index} className="w-full border rounded-none overflow-hidden">
           <CardHeader className="pb-3 pt-4 bg-muted/50 border-b"> {/* Added border */}
             {/* Display Make and Model Separately */}
             <CardTitle className="text-lg flex items-center gap-2 font-serif">
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
                 <Badge variant={getConfidenceBadgeVariant(pedal.confidence)} className="rounded-none"> {/* Removed rounded corners */}
                   {getConfidenceLabel(pedal.confidence)} ({(pedal.confidence * 100).toFixed(0)}%)
                 </Badge>
               ) : (
                 <Badge variant="secondary" className="rounded-none"> {/* Removed rounded corners */}
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
                 <Badge variant={getAdviceBadgeVariant(pedal.advice)} className="capitalize rounded-none"> {/* Removed rounded corners */}
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
