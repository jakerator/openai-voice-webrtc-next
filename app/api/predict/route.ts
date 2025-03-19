import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI(); // Initialize OpenAI client for making API requests

// Define the Zod schema for the API response
const ItemResponse = z.object({
    object_on_image: z.boolean(),
    image_desciption: z.string(),
});

export async function POST(req) {
    // Step 1: Extract the base64 string from the request body
    const { image, prompt } = await req.json();

    try {
        // Step 2: Send a prompt to the OpenAI API for prediction
        const apidata = {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt }, // Add the text prompt for prediction
                        {
                            type: "image_url",
                            image_url: {
                                url: image, // Include the base64 image URL
                            },
                        },
                    ],
                },
            ],
            response_format: zodResponseFormat(ItemResponse, "item_response"),
        }
        const response = await openai.chat.completions.create(apidata);
        console.log(apidata.messages[0].content[0]);
        console.log(response.choices[0].message);

        // Step 3: Extract the predicted item name and category from the API's response
        const itemInfo = response.choices[0].message.content;
        // Step 4: Parse the response content to JSON
        const parsedItemInfo = JSON.parse(itemInfo);

        // Step 5: Return the parsed item information as a JSON response
        return NextResponse.json({ message: parsedItemInfo }, { status: 200 });

    } catch (error) {
        console.error("Prediction failed for item."); // Log prediction error
        return NextResponse.json({ error: "Prediction failed for item." }, { status: 500 });
    }
}