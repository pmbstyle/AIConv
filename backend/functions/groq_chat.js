import * as dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

const system_prompt = 'Answer in one sentence to following question: '
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

const groq_chat = async (text) => {
    try {
        const chatCompletion = await chat(text)
        return chatCompletion.choices[0]?.message?.content || ""
    } catch (error) {
        console.error(error)
        return {
            error: 'Error occurred while processing the request.',
            error_message: error.message
        }
    }
}

async function chat(text) {
    return groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: system_prompt+text
            }
        ],
        model: "llama3-70b-8192"
    });
}

export default groq_chat