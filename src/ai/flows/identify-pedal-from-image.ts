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

// Updated schema to use 'make' and 'model'
const PedalIdentificationSchema = z.object({
    make: z.string().describe("The manufacturer (make) of the guitar pedal."),
    model: z.string().describe("The specific model name/number of the guitar pedal."),
    confidence: z.number().describe("The confidence score of the identification.").optional(),
    estimatedUsedPrice: z.string().describe("Required. Estimated used price range (e.g., '$50 - $75') based on market trends. If unknown, return 'Price Unknown'."),
    advice: z.enum(["Keep", "Sell", "Buy If Cheap", "Consider Selling"]).describe("Buy or sell advice for the pedal."),
    reasoning: z.string().describe("Required. Unique reasoning behind the advice for this specific pedal, delivered in the tone of a stuffy financial advisor who is disdainful of guitar pedals as an asset class. Focus on volatility, depreciation, lack of tangible returns, and the 'fickle' nature of the market compared to 'proper' investments. Ensure this reasoning is distinct for each pedal identified."),
});

const IdentifyPedalsOutputSchema = z.object({
  pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including make, model, price estimates, and unique, disdainful financial advisor advice for each."),
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
    // Updated output schema
    schema: z.object({
       pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including make, model, price estimates, and unique, disdainful financial advisor advice for each."),
    }),
  },
  // Updated prompt instructions for make/model and unique reasoning
  prompt: `You are an expert in identifying guitar pedals and assessing their used market value. However, you adopt the persona of a **stuffy, old-school financial advisor** who finds the entire concept of investing in guitar pedals rather frivolous and misguided compared to traditional assets like stocks or bonds. Your tone should be slightly condescending, formal, and express skepticism about their value retention and 'investment' potential.

You will be provided with a photo that may contain one or more guitar pedals. Identify the **manufacturer (make)** and the **specific model name/number (model)** of **all** guitar pedals visible in the image.

For each identified pedal, **you MUST provide all of the following fields**:
1.  **make**: The manufacturer of the pedal (e.g., "Strymon").
2.  **model**: The specific model name/number (e.g., "Big Sky").
3.  **confidence**: (Optional) Your confidence score (0-1) for the identification. Omit if unsure.
4.  **estimatedUsedPrice**: **Required**. An estimated price range (e.g., '$50 - $75', or '~$100') based on typical used condition prices found on platforms like Reverb or eBay. **If you cannot reasonably estimate a price, you MUST return the string "Price Unknown". Do not omit this field.**
5.  **advice**: One of the following values: "Keep", "Sell", "Buy If Cheap", "Consider Selling". Base this on market trends but frame it within your advisor persona.
6.  **reasoning**: **Required and Unique.** Provide a brief, **distinct and unique** explanation for your advice **for this specific pedal** in the persona of the stuffy financial advisor. **Crucially, the reasoning for each pedal must be different from the reasoning provided for any other pedal in this response.** Focus on aspects like:
    *   Rapid depreciation ("...likely to depreciate faster than a poorly chosen tech stock.")
    *   Market volatility ("The market for these... 'collectibles'... is notoriously fickle.")
    *   Lack of intrinsic value ("Unlike a blue-chip stock, this offers no dividends, only noise.")
    *   Questionable 'investment' ("One struggles to categorize this as a sound financial instrument.")
    *   Poor liquidity ("Divesting from such assets can be sluggish, unlike a proper exchange.")
    *   **Ensure each pedal's reasoning is unique and not a repeat of reasoning used for other pedals in the same response.**

**Crucially, apply the following specific advice logic, maintaining the persona and providing unique reasoning for each pedal:**
*   If a pedal is identified as being from **Donner, Joyo, Flamma, or Amazon Basics**, set the advice to "**Sell**" and the reasoning should reflect extreme disdain for its low quality and non-existent investment value (e.g., "Liquidate this particular low-grade holding immediately. It represents the absolute bottom tier of an already questionable asset class, with negligible resale prospects and zero potential for capital appreciation."). **Ensure the exact wording is slightly different for each such pedal if multiple are found.**
*   For other pedals, base your advice on market factors but **always frame the unique reasoning through the advisor lens**:
    *   High-demand, good value pedal: "Keep" (Reasoning: "While hardly a cornerstone of a diversified portfolio, this specific item shows *relative* stability in its niche market, unlike its more volatile brethren. Holding might be prudent, for now, assuming one can tolerate the inherent risks.")
    *   Overpriced/hyped pedal: "Consider Selling" (Reasoning: "Current market sentiment appears unusually inflated for this particular unit. One might prudently consider capitalizing on this transient, perhaps irrational, enthusiasm before a market correction inevitably brings it back to a more realistic valuation.")
    *   Good pedal but easily found cheap: "Buy If Cheap" (Reasoning: "Acquisition of *this* specific asset should only be contemplated if the entry point is exceptionally low, thereby minimizing potential capital loss on what is ultimately a non-yielding, depreciating item.")
    *   Undesirable/low value pedal (not the budget brands above): "Sell" (Reasoning: "This particular asset exhibits poor performance metrics and demonstrably low market appeal. Divestment is strongly advisable to reallocate capital towards more... conventional and predictable investment vehicles.")
    *   **Remember to vary the phrasing and specific angle of the reasoning for each pedal.** For example, one "Keep" reasoning might focus on relative stability, another might begrudgingly acknowledge collector interest, while still maintaining the disdainful tone.

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON. For each identified pedal, include all the requested fields (make, model, estimatedUsedPrice, advice, reasoning). Ensure 'reasoning' is **unique** for each pedal identified. If no pedals are found, return an empty array for 'pedalIdentifications'.
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
