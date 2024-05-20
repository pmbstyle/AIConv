import * as dotenv from "dotenv"
dotenv.config()
import { Ollama } from "@langchain/community/llms/ollama"
const llm = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
})

const system_prompt = 'Follow the conversation and provide the best and short answers. '
const messages = []
const ollama_chat = async (text) => {
    try {
        messages.push({from:'user', message:text})
        const response = await llm.invoke(system_prompt+JSON.stringify(messages))
        messages.push({from:'ai', message:response})
        return response
    } catch (error) {
        console.error(error)
        return {
            error:'Error occurred while processing the request.',
            error_message: error.message
        }
    }
}

export default ollama_chat