import { GoogleGenAI, Modality } from "@google/genai";
import { ColorSelection, ExteriorPart } from '../types';
import { MASK_COLORS } from "../constants/masks";

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


export const applyColorsToHouse = async (
    base64ImageData: string, 
    mimeType: string, 
    colors: Partial<ColorSelection>, 
    userPrompt: string, 
    addLogo: boolean,
    maskData: string | null,
    referenceImage: { base64: string; mimeType: string } | null
): Promise<string | null> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt: string;
  const imageParts = [{
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  }];

  if (maskData) {
      const maskLegend = (Object.keys(MASK_COLORS) as ExteriorPart[])
        .map(part => `- ${MASK_COLORS[part].color} (HEX): This color in the mask image represents the '${partToHumanReadable[part]}'`)
        .join('\n');
      
      const colorInstructions = (Object.keys(colors) as ExteriorPart[])
        .map(part => `- ${partToHumanReadable[part]}: Apply the color ${colors[part]}`)
        .join('\n');

      prompt = `
        You are a master photo editor specializing in photorealistic architectural visualization. You have been provided with two images:
        1. The original photo of a house.
        2. A 'mask' image that identifies different parts of the house using specific colors.

        This is the legend for the mask image's colors:
        ${maskLegend}

        Your task is to edit the ORIGINAL photo. Use the MASK image as a precise guide to apply the following new paint colors to the corresponding parts of the house:
        ${colorInstructions}
        
        CRITICAL INSTRUCTIONS:
        - Apply the new colors with absolute photorealism. The final image must look like a real photograph.
        - Preserve all original surface textures, lighting, shadows, and reflections.
        - ONLY color the areas defined in the mask. Do NOT change any other part of the image (e.g., sky, trees, cars, landscaping, neighboring houses).
        - If an area is not colored in the mask, it must remain untouched from the original photo.
      `;

      if (userPrompt && userPrompt.trim() !== '') {
        prompt += `\nAn additional user request to consider while editing: "${userPrompt}"`;
      }
      
      if (addLogo) {
          prompt += `\nFinally, add a small, discreet, and professional watermark to the bottom-right corner of the image. The watermark should consist of the word "JAKIR" in a stylish, metallic gold font. Enclose this text within a thin, elegant, rectangular gold frame. The watermark should look luxurious and professional, blending naturally with the image's lighting, and must not obstruct the main view of the house.`;
      }

      imageParts.push({
          inlineData: {
              data: maskData,
              mimeType: 'image/png'
          }
      });

  } else if (referenceImage) {
      const colorInstructions = (Object.keys(colors) as ExteriorPart[])
        .map(part => `- ${partToHumanReadable[part]}: Apply the color ${colors[part]}`)
        .join('\n');

      prompt = `
        You are a master photo editor specializing in photorealistic architectural visualization. You have been provided with two images:
        1. The 'original image' of a house that needs to be edited.
        2. A 'reference image' that provides style inspiration.

        Your primary task is to repaint the 'original image', drawing inspiration for the style, color palette, materials, and overall aesthetic from the 'reference image'.

        CRITICAL INSTRUCTIONS:
        - Apply the style of the 'reference image' to the 'original image' with absolute photorealism. The final result must look like a real photograph.
        - Do NOT change the architectural structure of the house in the 'original image'. Only modify its surfaces (walls, roof, doors, etc.).
        - Preserve the original background, landscaping, sky, and any surrounding objects (like cars, plants) from the 'original image'. ONLY edit the house itself.
        - If specific color requests are provided below, try to incorporate them into the style of the reference image. The reference style is the priority, but these colors should be used if they fit the aesthetic.
        ${colorInstructions}
      `;
      
      if (userPrompt && userPrompt.trim() !== '') {
        prompt += `\nAn additional user request to consider while editing: "${userPrompt}"`;
      }
      
      if (addLogo) {
          prompt += `\nFinally, add a small, discreet, and professional watermark to the bottom-right corner of the image. The watermark should consist of the word "JAKIR" in a stylish, metallic gold font. Enclose this text within a thin, elegant, rectangular gold frame. The watermark should look luxurious and professional, blending naturally with the image's lighting, and must not obstruct the main view of the house.`;
      }

      imageParts.push({ // Reference image is the second image in the payload
          inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType }
      });

  } else {
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
            .filter(Boolean);

        const uniquePartNames = [...new Set(partNamesToIgnore)];
        if (uniquePartNames.length > 0) {
            ignoreInstructions = `\nIMPORTANT: Do NOT change the color of the following parts: ${uniquePartNames.join(', ')}. They must remain as they are in the original photo.`;
        }
    }

    prompt = `
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
        Finally, add a small, discreet, and professional watermark to the bottom-right corner of the image. The watermark should consist of the word "JAKIR" in a stylish, metallic gold font. Enclose this text within a thin, elegant, rectangular gold frame. The watermark should look luxurious and professional, blending naturally with the image's lighting, and must not obstruct the main view of the house.
        `;
    }

    prompt += `
      The final image must be a high-definition, realistic photograph with natural lighting and shadows, preserving the original texture of the surfaces.
      If 'A primary, prominent feature wall' color is specified but no such wall exists, apply it to a smaller, suitable accent area. If no feature walls are specified or exist, use the main wall color for all walls.
      Do not add any text or watermarks, other than the specified "JAKIR" logo if requested.
    `;
  }


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          ...imageParts,
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
