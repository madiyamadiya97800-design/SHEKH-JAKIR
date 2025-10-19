import { GoogleGenAI, Modality } from "@google/genai";
import { ColorSelection, ExteriorPart } from '../types';

export const applyColorsToHouse = async (base64ImageData: string, mimeType: string, colors: ColorSelection): Promise<string | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert photo editor specializing in architectural visualization.
    Edit the following image of a house exterior with photorealistic quality.
    DO NOT change the structure of the house, the background, landscaping, sky, or any surrounding objects like cars, plants, or pathways.
    Only change the colors of the specified parts of the building itself.
    Apply the following colors precisely and realistically to the specified parts:
    - All exterior walls: ${colors[ExteriorPart.WALL]}
    - The main entrance door(s): ${colors[ExteriorPart.DOOR]}
    - All window frames: ${colors[ExteriorPart.WINDOW]}
    - The entire roof surface: ${colors[ExteriorPart.ROOF]}
    The final image must be a high-definition, realistic photograph with natural lighting and shadows, preserving the original texture of the surfaces.
    Do not add any text or watermarks.
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