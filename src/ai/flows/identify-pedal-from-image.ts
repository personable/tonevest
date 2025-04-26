'use server';
/**
 * @fileOverview Identifies one or more guitar pedals from an image, providing price estimates and advice.
 *
 * - identifyPedals - A function that identifies all guitar pedals visible in an image.
 * - IdentifyPedalsInput - The input type for the identifyPedals function.
 * - IdentifyPedalsOutput - The return type for the identifyPedals function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const IdentifyPedalsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo potentially containing multiple guitar pedals, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPedalsInput = z.infer<typeof IdentifyPedalsInputSchema>;

const PedalIdentificationSchema = z.object({
    make: z.string().describe("The make of the guitar pedal."),
    model: z.string().describe("The model of the guitar pedal."),
    confidence: z.number().describe("The confidence score of the identification.").optional(),
    // Make estimatedUsedPrice required
    estimatedUsedPrice: z.string().describe("Required. Estimated used price range (e.g., '$50 - $75') based on market trends. If unknown, return 'Price Unknown'."),
    advice: z.enum(["Keep", "Sell", "Buy If Cheap", "Consider Selling"]).describe("Buy or sell advice for the pedal."),
    reasoning: z.string().describe("Reasoning behind the advice, considering quality, desirability, and market value."),
});

const IdentifyPedalsOutputSchema = z.object({
  pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including price estimates and advice."),
});
export type IdentifyPedalsOutput = z.infer<typeof IdentifyPedalsOutputSchema>;

export async function identifyPedals(input: IdentifyPedalsInput): Promise<IdentifyPedalsOutput> {
  return identifyPedalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPedalsPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo potentially containing multiple guitar pedals, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
       pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including price estimates and advice."),
    }),
  },
  prompt: `You are an expert in identifying guitar pedals and assessing their used market value and desirability, referencing knowledge from sources like eBay and Reverb.com.

You will be provided with a photo that may contain one or more guitar pedals. Identify the make and model of **all** guitar pedals visible in the image.

For each identified pedal, **you MUST provide all of the following fields**:
1.  **make**: The manufacturer of the pedal.
2.  **model**: The specific model name/number.
3.  **confidence**: (Optional) Your confidence score (0-1) for the identification. Omit if unsure.
4.  **estimatedUsedPrice**: **Required**. An estimated price range (e.g., '$50 - $75', or '~$100') based on typical used condition prices found on platforms like Reverb or eBay. **If you cannot reasonably estimate a price, you MUST return the string "Price Unknown". Do not omit this field.**
5.  **advice**: One of the following values: "Keep", "Sell", "Buy If Cheap", "Consider Selling".
6.  **reasoning**: A brief explanation for your advice.

**Crucially, apply the following specific advice logic:**
*   If a pedal is identified as being from **Donner, Joyo, Flamma, or Amazon Basics**, set the advice to "**Sell**" and the reasoning should explicitly state that it's a low-quality/budget brand with poor resale value and recommend selling it (e.g., "Sell this low-quality pedal, poor resale value.").
*   For other pedals, base your advice on factors like build quality, sound reputation, market demand, collectibility, and current used price trends. For example:
    *   High-demand, good value pedal: "Keep" (Reasoning: "Solid pedal, holds value well.")
    *   Overpriced/hyped pedal: "Consider Selling" (Reasoning: "Prices are high right now, could be a good time to sell.")
    *   Good pedal but easily found cheap: "Buy If Cheap" (Reasoning: "Great value if found under $X.")
    *   Undesirable/low value pedal (not the budget brands above): "Sell" (Reasoning: "Limited demand, unlikely to appreciate.")

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON. For each identified pedal, include all the requested fields (especially 'estimatedUsedPrice'). If no pedals are found, return an empty array for 'pedalIdentifications'.
`,
});

const identifyPedalsFlow = ai.defineFlow<
  typeof IdentifyPedalsInputSchema,
  typeof IdentifyPedalsOutputSchema
>({
  name: 'identifyPedalsFlow',
  inputSchema: IdentifyPedalsInputSchema,
  outputSchema: IdentifyPedalsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  // Ensure we always return an object with the expected array structure, even if the AI returns null/undefined
  return output || { pedalIdentifications: [] };
});
