import * as dotenv from "dotenv"
dotenv.config()
import { Ollama } from "@langchain/community/llms/ollama"
const llm = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
})

const messages = []
const system_prompt = `
    You are a helpful assistant.
    You should provide a short and informative answer to the user question.
    Follow the conversation and provide the best and short answer.
    Respond only with your answer, don't include anything else just your full answer.`
const ollama_chat = async (text) => {
    try {
        if(text.includes('userfirstmessage')) {
            messages.length = 0
            text = text.replace('userfirstmessage','')
        }
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