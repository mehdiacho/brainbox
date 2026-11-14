import { gemini } from './firebase'; // Import the initialized Gemini model

// Helper function to convert a file to a base64 data URL string.
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Helper to create a file part for the Gemini API from a data URL
const fileToGenerativePart = (dataUrl, mimeType) => {
    return {
        inlineData: {
            data: dataUrl.split(',')[1],
            mimeType
        },
    };
};

export const transcribeAudio = async (audioFile) => {
    const prompt = "Transcribe this audio file accurately. Provide only the transcribed text, without any additional commentary or formatting.";
    const dataUrl = await fileToDataUrl(audioFile);
    const filePart = fileToGenerativePart(dataUrl, audioFile.type);
    
    const result = await gemini.generateContent([prompt, filePart]);
    return result.response.text();
};

export const suggestTitleForIdea = async (fullContext) => {
    const prompt = `You are a title suggestion AI. Based on the following context, suggest a short, compelling title for the entire idea. Output ONLY the title itself, without any introductory text or quotation marks. Context:\n${fullContext}`;
    const result = await gemini.generateContent(prompt);
    return result.response.text();
};

export const summarizeIdea = async (fullContext) => {
    const prompt = `You are a summarization AI. Analyze the entire context of this idea and provide a concise summary. Do not include any introductory phrases like "Based on the context...". Just provide the summary. Context:\n${fullContext}`;
    const result = await gemini.generateContent(prompt);
    return result.response.text();
};

export const getTakeawaysForIdea = async (fullContext) => {
    const prompt = `You are a key points AI. Analyze the entire context of this idea and extract the key takeaways as a bulleted list. Do not include any introductory phrases. Just provide the bulleted list. Context:\n${fullContext}`;
    const result = await gemini.generateContent(prompt);
    return result.response.text();
};

export const suggestTitleForMedia = async (mediaItem) => {
    let prompt;
    if (mediaItem.type === 'audio') {
        prompt = `Generate a short, descriptive title (4-6 words) for the following transcription. Output ONLY the title itself, without any extra text or quotes. \n\nTranscription: ${mediaItem.transcription}`;
        const result = await gemini.generateContent(prompt);
        return result.response.text();
    } else { // Image
        prompt = 'Describe this image in 4-6 words to use as a title. Output ONLY the title itself, without quotes.';
        const filePart = fileToGenerativePart(mediaItem.src, mediaItem.src.match(/:(.*?);/)[1]);
        const result = await gemini.generateContent([prompt, filePart]);
        return result.response.text();
    }
};

export const describeImageAndTags = async (imageItem) => {
    const schema = {
        type: "OBJECT",
        properties: {
          description: { "type": "STRING", "description": "A concise one-sentence description of the image." },
          tags: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3-7 relevant keywords or tags for the image." }
        }
    };
    const prompt = 'Analyze this image. Provide a concise one-sentence description and a list of 3-7 relevant tags.';
    const filePart = fileToGenerativePart(imageItem.src, imageItem.src.match(/:(.*?);/)[1]);

    const result = await gemini.generateContent({
        contents: [{ parts: [ {text: prompt}, filePart ] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(result.response.text());
};