import { GoogleGenAI, Modality } from "@google/genai";
import { ColorSelection, ExteriorPart } from '../types';

const partToHumanReadable: Record<ExteriorPart, string> = {
  [ExteriorPart.WALL]: 'All general exterior walls',
  [ExteriorPart.FEATURE_WALL_1]: 'A primary, prominent feature wall',
  [ExteriorPart.FEATURE_WALL_2]: 'A secondary feature wall',
  [ExteriorPart.DOOR]: 'The main entrance door(s)',
  [ExteriorPart.WINDOW]: 'All window frames',
  [ExteriorPart.ROOF]: 'The entire roof surface',
  [ExteriorPart.RAILING]: 'All railings (e.g., on balconies, stairs, porches)',
};

const partToIgnorePhrase: Record<string, string> = {
  [ExteriorPart.DOOR]: 'the doors',
  [ExteriorPart.WINDOW]: 'the window frames',
  [ExteriorPart.ROOF]: 'the roof',
  [ExteriorPart.RAILING]: 'the railings',
  [ExteriorPart.FEATURE_WALL_1]: 'any feature or accent walls',
  [ExteriorPart.FEATURE_WALL_2]: 'any feature or accent walls',
};


export const applyColorsToHouse = async (base64ImageData: string, mimeType: string, colors: Partial<ColorSelection>, userPrompt: string, addLogo: boolean): Promise<string | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const partsToColor = Object.keys(colors) as ExteriorPart[];

  const colorInstructions = partsToColor
    .map(part => `- ${partToHumanReadable[part]}: ${colors[part]}`)
    .join('\n');
  
  const allPossibleParts = Object.values(ExteriorPart);
  const partsToIgnore = allPossibleParts.filter(part => !partsToColor.includes(part));

  let ignoreInstructions = '';
  if (partsToIgnore.length > 0) {
      const partNamesToIgnore = partsToIgnore
          .map(part => partToIgnorePhrase[part])
          .filter(Boolean); // Filter out undefined values (like for WALL)

      const uniquePartNames = [...new Set(partNamesToIgnore)];
      if (uniquePartNames.length > 0) {
          ignoreInstructions = `\nIMPORTANT: Do NOT change the color of the following parts: ${uniquePartNames.join(', ')}. They must remain as they are in the original photo.`;
      }
  }

  let prompt = `
    You are an expert photo editor specializing in architectural visualization.
    Edit the following image of a house exterior with photorealistic quality.
    DO NOT change the structure of the house, the background, landscaping, sky, or any surrounding objects like cars, plants, or pathways.
    Only change the colors of the specified parts of the building itself.
    Apply the following colors precisely and realistically to the specified parts:
    ${colorInstructions}
    ${ignoreInstructions}
  `;

  if (userPrompt && userPrompt.trim() !== '') {
    prompt += `\nIn addition, follow this specific user instruction: "${userPrompt}"`;
  }
  
  if (addLogo) {
      prompt += `
      Finally, add a small, discreet, and professional watermark to the bottom-right corner of the image. The watermark should be a stylized monogram "S/J" in a light grey color (#cccccc) with a very subtle drop shadow for visibility. It should be elegant and not obstruct the view of the house.
      `;
  }

  prompt += `
    The final image must be a high-definition, realistic photograph with natural lighting and shadows, preserving the original texture of the surfaces.
    If 'A primary, prominent feature wall' color is specified but no such wall exists, apply it to a smaller, suitable accent area. If no feature walls are specified or exist, use the main wall color for all walls.
    Do not add any text or watermarks, other than the specified 'S/J' monogram if requested.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        return response.candidates[0].content.parts[0].inlineData.data;
    }
    
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image. Please check the console for details.");
  }
};