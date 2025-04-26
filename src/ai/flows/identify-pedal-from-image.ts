'use server';
/**
 * @fileOverview Identifies one or more guitar pedals from an image.
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
});

const IdentifyPedalsOutputSchema = z.object({
  pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image."),
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
       pedalIdentifications: z.array(PedalIdentificationSchema).describe("An array of identified guitar pedals found in the image."),
    }),
  },
  prompt: `You are an expert in identifying guitar pedals.

You will be provided with a photo that may contain one or more guitar pedals. Identify the make and model of **all** guitar pedals visible in the image.

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON. For each identified pedal, include its make and model. If you are confident about an identification, include a confidence score (0-1). If you are not confident, omit the confidence field for that specific pedal. If no pedals are found, return an empty array for 'pedalIdentifications'.
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
