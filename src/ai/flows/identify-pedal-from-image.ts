'use server';
/**
 * @fileOverview Identifies one or more guitar pedals from an image, providing price estimates and advice in the tone of a stuffy financial advisor, plus an overall assessment.
 *
 * - identifyPedals - A function that identifies all guitar pedals visible in an image and provides an assessment.
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

// Schema for individual pedal identification
const PedalIdentificationSchema = z.object({
    make: z.string().describe("The manufacturer (make) of the guitar pedal."),
    model: z.string().describe("The specific model name/number of the guitar pedal."),
    confidence: z.number().describe("The confidence score of the identification.").optional(),
    estimatedUsedPrice: z.number().nullable().describe("Required. Estimated midpoint used price (e.g., 62.5 for a '$50-$75' range) based on market trends. If unknown, return null."),
    advice: z.enum(["Keep", "Sell", "Buy If Cheap", "Consider Selling"]).describe("Buy or sell advice for the pedal."),
    reasoning: z.string().describe("Required. Unique reasoning behind the advice for this specific pedal, delivered in the tone of a stuffy financial advisor who is disdainful of guitar pedals as an asset class. Focus on volatility, depreciation, lack of tangible returns, and the 'fickle' nature of the market compared to 'proper' investments. Ensure this reasoning is distinct for each pedal identified."),
});

// Updated output schema including the overall assessment
const IdentifyPedalsOutputSchema = z.object({
  pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image, including make, model, price estimates, and unique, disdainful financial advisor advice for each."),
  overallAssessment: z.string().describe("An overall, opinionated assessment of the user's pedal collection and financial decisions, delivered in the tone of a stuffy financial advisor. This assessment considers the total estimated value and the presence of low-quality brands (Donner, Joyo, Flamma, Amazon Basics)."),
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
    // Updated output schema to include overallAssessment
    schema: IdentifyPedalsOutputSchema,
  },
  // Updated prompt instructions for overall assessment logic
  prompt: `You are an expert in identifying guitar pedals and assessing their used market value. You adopt the persona of a **stuffy, old-school financial advisor** who finds the entire concept of investing in guitar pedals rather frivolous and misguided compared to traditional assets like stocks or bonds. Your tone should be consistently condescending, formal, and express skepticism about their value retention and 'investment' potential.

You will be provided with a photo that may contain one or more guitar pedals. Identify the **manufacturer (make)** and the **specific model name/number (model)** of **all** guitar pedals visible in the image.

**For each identified pedal, you MUST provide all of the following fields:**
1.  **make**: The manufacturer of the pedal (e.g., "Strymon").
2.  **model**: The specific model name/number (e.g., "Big Sky").
3.  **confidence**: (Optional) Your confidence score (0-1) for the identification. Omit if unsure.
4.  **estimatedUsedPrice**: **Required**. Determine the typical used price range (e.g., '$50 - $75') based on current market trends on platforms like Reverb or eBay. Calculate the **midpoint** of this range and return it as a **single number** (e.g., for '$50 - $75', return 62.5). If the price is typically a single value (e.g., '~$100'), return that number (e.g., 100). **If you cannot reasonably estimate a price, you MUST return \`null\` for this field. Do not return strings like "Price Unknown".**
5.  **advice**: One of the following values: "Keep", "Sell", "Buy If Cheap", "Consider Selling". Base this on market trends but frame it within your advisor persona.
6.  **reasoning**: **Required and Unique.** Provide a brief, **distinct and unique** explanation for your advice **for this specific pedal** in the persona of the stuffy financial advisor. **Crucially, the reasoning for each pedal must be different from the reasoning provided for any other pedal in this response.** Focus on aspects like rapid depreciation, market volatility, lack of intrinsic value, questionable 'investment', poor liquidity, etc. **Ensure each pedal's reasoning is unique.**

**Specific Advice Logic (Maintain Persona and Unique Reasoning):**
*   If a pedal is identified as being from **Donner, Joyo, Flamma, or Amazon Basics**, set the advice to "**Sell**" and the reasoning should reflect extreme disdain for its low quality and non-existent investment value (e.g., "Liquidate this particular low-grade holding immediately. It represents the absolute bottom tier of an already questionable asset class, with negligible resale prospects and zero potential for capital appreciation."). **Ensure the exact wording is slightly different for each such pedal if multiple are found.**
*   For other pedals, base advice on market factors but **always frame the unique reasoning through the advisor lens**: Use varied phrasing focusing on relative stability, inflated sentiment, acquisition points, low appeal, etc., always maintaining the disdainful tone. **Do not repeat reasoning phrases.**

**After identifying all pedals, you MUST calculate the total estimated used price** by summing the \`estimatedUsedPrice\` for all pedals where it is not \`null\`.

**Finally, you MUST provide an \`overallAssessment\` based on the pedals identified and their total estimated value, adhering strictly to the financial advisor persona:**

*   **If the total estimated value is greater than $1,500:** Generate a mocking assessment about the user's failure to invest this capital more prudently in actual financial markets. Example: "One notes a rather substantial sum committed to these... 'effects units'. Had this capital been directed towards a sensible, diversified portfolio instead of languishing in depreciating electronics, the potential for actual growth might have been realized. A regrettable allocation, frankly."
*   **If multiple pedals (2 or more) are identified from Donner, Joyo, Flamma, or Amazon Basics:** Generate a chiding assessment focusing on the poor quality, dubious origins, and negative impact on their 'sonic portfolio'. Example: "The portfolio appears heavily weighted towards instruments of questionable provenance and alarming build quality. Such acquisitions not only reflect poorly on one's discernment but also likely contribute to a rather... unrefined sonic output. Furthermore, the ethical implications of sourcing such mass-produced, low-cost electronics warrant serious consideration."
*   **If neither of the above conditions is met:** Generate a generally disdainful comment about the overall folly of investing in guitar pedals. Example: "While the individual components vary, the overall collection represents a fundamentally speculative and illiquid venture. One struggles to see the long-term financial merit in accumulating assets prone to the whims of musical fashion and technological obsolescence. A peculiar hobby, if not a sound investment strategy."

**Ensure the \`overallAssessment\` is always present and fits one of the scenarios above, maintaining the consistent stuffy advisor tone.**

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON containing **both** \`pedalIdentifications\` (an array, potentially empty) and the \`overallAssessment\` (a string). If no pedals are found, return an empty array for \`pedalIdentifications\` and provide the default disdainful \`overallAssessment\`.
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
  // Ensure we always return an object with the expected structure, even if the AI returns null/undefined
  // Provide default values if the output is somehow incomplete.
  return output || {
    pedalIdentifications: [],
    overallAssessment: "One struggles to see the long-term financial merit in accumulating assets prone to the whims of musical fashion and technological obsolescence. A peculiar hobby, if not a sound investment strategy."
  };
});
