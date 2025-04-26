'use server';
/**
 * @fileOverview Identifies a guitar pedal from an image.
 *
 * - identifyPedal - A function that identifies the guitar pedal from an image.
 * - IdentifyPedalInput - The input type for the identifyPedal function.
 * - IdentifyPedalOutput - The return type for the identifyPedal function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const IdentifyPedalInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a guitar pedal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPedalInput = z.infer<typeof IdentifyPedalInputSchema>;

const IdentifyPedalOutputSchema = z.object({
  pedalIdentification: z.object({
    make: z.string().describe("The make of the guitar pedal."),
    model: z.string().describe("The model of the guitar pedal."),
    confidence: z.number().describe("The confidence score of the identification.").optional(),
  }),
});
export type IdentifyPedalOutput = z.infer<typeof IdentifyPedalOutputSchema>;

export async function identifyPedal(input: IdentifyPedalInput): Promise<IdentifyPedalOutput> {
  return identifyPedalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPedalPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo of a guitar pedal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      pedalIdentification: z.object({
        make: z.string().describe("The make of the guitar pedal."),
        model: z.string().describe("The model of the guitar pedal."),
        confidence: z.number().describe("The confidence score of the identification.").optional(),
      }),
    }),
  },
  prompt: `You are an expert in identifying guitar pedals.

You will be provided with a photo of a guitar pedal. You will identify the make and model of the pedal.

Analyze the following photo:

{{media url=photoDataUri}}

Respond with valid JSON. If you are not confident in the identification, omit the confidence field.
`,
});

const identifyPedalFlow = ai.defineFlow<
  typeof IdentifyPedalInputSchema,
  typeof IdentifyPedalOutputSchema
>({
  name: 'identifyPedalFlow',
  inputSchema: IdentifyPedalInputSchema,
  outputSchema: IdentifyPedalOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
