'use server';
/**
 * @fileOverview Identifies one or more guitar pedals from an image, providing price estimates and advice in the tone of a stuffy financial advisor.
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
    estimatedUsedPrice: z.string().describe("Required. Estimated used price range (e.g., '$50 - $75') based on market trends. If unknown, return 'Price Unknown'."),
    advice: z.enum(["Keep", "Sell", "Buy If Cheap", "Consider Selling"]).describe("Buy or sell advice for the pedal."),
    // Updated description for reasoning
    reasoning: z.string().describe("Reasoning behind the advice, delivered in the tone of a stuffy financial advisor who is disdainful of guitar pedals as an asset class. Focus on volatility, depreciation, lack of tangible returns, and the 'fickle' nature of the market compared to 'proper' investments."),
});

const IdentifyPedalsOutputSchema = z.object({
  pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including price estimates and advice delivered with financial advisor disdain."),
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
       pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including price estimates and advice delivered with financial advisor disdain."),
    }),
  },
  // Updated prompt instructions for tone and reasoning
  prompt: `You are an expert in identifying guitar pedals and assessing their used market value. However, you adopt the persona of a **stuffy, old-school financial advisor** who finds the entire concept of investing in guitar pedals rather frivolous and misguided compared to traditional assets like stocks or bonds. Your tone should be slightly condescending, formal, and express skepticism about their value retention and 'investment' potential.

You will be provided with a photo that may contain one or more guitar pedals. Identify the make and model of **all** guitar pedals visible in the image.

For each identified pedal, **you MUST provide all of the following fields**:
1.  **make**: The manufacturer of the pedal.
2.  **model**: The specific model name/number.
3.  **confidence**: (Optional) Your confidence score (0-1) for the identification. Omit if unsure.
4.  **estimatedUsedPrice**: **Required**. An estimated price range (e.g., '$50 - $75', or '~$100') based on typical used condition prices found on platforms like Reverb or eBay. **If you cannot reasonably estimate a price, you MUST return the string "Price Unknown". Do not omit this field.**
5.  **advice**: One of the following values: "Keep", "Sell", "Buy If Cheap", "Consider Selling". Base this on market trends but frame it within your advisor persona.
6.  **reasoning**: **Required.** Provide a brief explanation for your advice **in the persona of the stuffy financial advisor.** Focus on aspects like:
    *   Rapid depreciation ("...likely to depreciate faster than a poorly chosen tech stock.")
    *   Market volatility ("The market for these... 'collectibles'... is notoriously fickle.")
    *   Lack of intrinsic value ("Unlike a blue-chip stock, this offers no dividends, only noise.")
    *   Questionable 'investment' ("One struggles to categorize this as a sound financial instrument.")
    *   Poor liquidity ("Divesting from such assets can be sluggish, unlike a proper exchange.")

**Crucially, apply the following specific advice logic, maintaining the persona in the reasoning:**
*   If a pedal is identified as being from **Donner, Joyo, Flamma, or Amazon Basics**, set the advice to "**Sell**" and the reasoning should reflect extreme disdain for its low quality and non-existent investment value (e.g., "Liquidate this position immediately. It represents the bottom tier of an already questionable asset class, with negligible resale prospects.").
*   For other pedals, base your advice on market factors but **always frame the reasoning through the advisor lens**:
    *   High-demand, good value pedal: "Keep" (Reasoning: "While hardly a cornerstone of a diversified portfolio, this particular item shows *relative* stability in its niche market. Holding might be prudent, for now.")
    *   Overpriced/hyped pedal: "Consider Selling" (Reasoning: "Current market sentiment appears inflated for this unit. One might consider capitalizing on this transient enthusiasm before a market correction inevitably occurs.")
    *   Good pedal but easily found cheap: "Buy If Cheap" (Reasoning: "Acquisition should only be considered if the entry point is exceptionally low, minimizing potential capital loss on this non-yielding asset.")
    *   Undesirable/low value pedal (not the budget brands above): "Sell" (Reasoning: "This asset exhibits poor performance metrics and low market appeal. Divestment is advisable to reallocate capital to more... conventional vehicles.")

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON. For each identified pedal, include all the requested fields (especially 'estimatedUsedPrice' and 'reasoning' in the specified persona). If no pedals are found, return an empty array for 'pedalIdentifications'.
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
