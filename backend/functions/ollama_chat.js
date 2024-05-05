import * as dotenv from "dotenv"
dotenv.config()
import { Ollama } from "@langchain/community/llms/ollama"
const llm = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
})

const system_prompt = 'Answer in one sentence to following question: '

const ollama_chat = async (text) => {
    try {
        const response = await llm.invoke(system_prompt+text)
        console.log('ollama_chat response', response)
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