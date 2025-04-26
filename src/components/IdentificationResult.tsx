import type { IdentifyPedalOutput } from '@/ai/flows/identify-pedal-from-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IdentificationResultProps {
  result: IdentifyPedalOutput | null;
}

export function IdentificationResult({ result }: IdentificationResultProps) {
  if (!result) {
    return null;
  }

  const { make, model, confidence } = result.pedalIdentification;

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
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Identification Result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground">Make:</span>
          <span className="font-semibold">{make || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground">Model:</span>
          <span className="font-semibold">{model || 'N/A'}</span>
        </div>
        {confidence !== undefined && (
          <div className="flex justify-between items-center">
             <span className="font-medium text-muted-foreground">Confidence:</span>
            <Badge variant={getConfidenceBadgeVariant(confidence)}>
              {getConfidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
            </Badge>
          </div>
        )}
         {confidence === undefined && (
          <div className="flex justify-between items-center">
             <span className="font-medium text-muted-foreground">Confidence:</span>
            <Badge variant="secondary">
              Not Specified
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
