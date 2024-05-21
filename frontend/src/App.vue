<template>
  <div class="bg-gray-800 h-screen flex w-full items-center justify-center">
    <div class="flex flex-col container mx-auto h-full items-center justify-center">
      <div class="bg-gray-900 p-6 rounded-lg flex flex-col md:flex-row h-1/2 w-full">
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <audio ref="audioPlayer" controls class="hidden"></audio>
          <div class="avatar w-[250px] h-[250px]">
            <div :class="['rounded-full ring ring-offset-base-100 ring-offset-2', { 'ring-success': isPlaying }]">
              <img
                :src="isPlaying ? AiAvatar : AiAvatarStatic"
                alt="AI Avatar"
              />
            </div>
          </div>
        </div>
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <div class="avatar w-[250px] h-[250px]">
            <div :class="['rounded-full ring ring-offset-base-100 ring-offset-2', { 'ring-success': isRecording }]">
              <img
                :src="isRecording ? UserAvatar : UserAvatarStatic"
                alt="User Avatar"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 rounded-lg flex items-center justify-center mt-6">
        <button
          class="btn"
          :class="{'btn-success': !isRecording, 'btn-error': isRecording}"
          @click="toggleRecording"
        >
          {{ isRecording ? 'Stop Listening' : 'Start Listening' }}
        </button>
      </div>
    </div>
    <div class="h-full w-full max-w-lg bg-gray-900 self-end p-4 overflow-y-scroll">
      <template v-if="chatHistory.length">
        <div
          class="chat mb-2"
          v-for="(message, index) in chatHistory"
          :key="index"
          :class="{'chat-start': message.from === 'ai', 'chat-end': message.from === 'user'}"
        >
          <div class="chat-image avatar">
            <div class="w-10 rounded-full">
              <img :src="message.from === 'ai' ? AiAvatarStatic : UserAvatarStatic" :alt="`${message.from} Avatar`" />
            </div>
          </div>
          <div class="chat-bubble" :class="{'chat-bubble-primary': message.from === 'ai'}">
            {{ message.message }}
          </div>
        </div>
      </template>
      <div class="mt-4" v-if="isInProgress">
        <span class="loading loading-ball loading-xs" v-for="n in 3" :key="n"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import { useSpeechRecognition } from '@vueuse/core'
import AiAvatar from '@/assets/images/ai-avatar-animated.gif'
import UserAvatar from '@/assets/images/user-avatar-animated.gif'
import AiAvatarStatic from '@/assets/images/ai-avatar-static.png'
import UserAvatarStatic from '@/assets/images/user-avatar-static.png'

const apiBase = import.meta.env.VITE_API_BASE_URL
console.log(apiBase)

const { isListening, isFinal, result, start, stop } = useSpeechRecognition({
  continuous: true,
  lang: 'en-US',
})

const recognizedText = ref('')
const isRecording = ref(false)
const audioPlayer = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const isInProgress = ref(false)
const chatHistory = ref<{ from: string, message: string }[]>([])

watch(result, (newResult) => {
  recognizedText.value = newResult
  if (recognizedText.value.length > 0 && chatHistory.value.length > 0) {
    chatHistory.value[chatHistory.value.length - 1].message = recognizedText.value
  }
}, { immediate: true })

const startListening = async () => {
  if (!isRecording.value) return

  start()
  console.log('Starting detecting silence.')
  chatHistory.value.push({ from: 'user', message: '...' })

  const audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)

  let silenceCounter = 0
  const silenceThreshold = 200

  const checkSilence = async () => {
    if (!isRecording.value) return

    analyser.getByteFrequencyData(dataArray)
    const isSilent = dataArray.every(value => value < silenceThreshold)

    if (isSilent) {
      silenceCounter++
    } else {
      silenceCounter = 0
    }

    if (silenceCounter > 299) {
      console.log(`Silence detected for the last ${silenceCounter} frames. Stopping recognition and checking for text.`)
      if (recognizedText.value.length > 0) {
        stop()
        isRecording.value = false
        console.log('Text recognized:', recognizedText.value)
        console.log('Sending to the server ...')
        if (chatHistory.value.length == 1) {
          recognizedText.value += ' userfirstmessage'
        }
        await sendAudioToServer(recognizedText.value)
        console.log('Response received from the server.')
        recognizedText.value = ''
        silenceCounter = 0
      } else {
        console.log('No text recognized.')
        silenceCounter = 0
        checkSilence()
      }
    } else {
      requestAnimationFrame(checkSilence)
    }
  }

  checkSilence()
}

const toggleRecording = () => {
  isRecording.value = !isRecording.value
  console.log('Toggling recording', isRecording.value)
  if (!isRecording.value) {
    stop()
    if (chatHistory.value[chatHistory.value.length - 1]?.message === '...') {
      chatHistory.value.pop()
    }
    console.log('Recording stopped.')
  } else {
    console.log('Recording started.')
    startListening()
  }
}

const sendAudioToServer = async (transcribedText: string) => {
  isInProgress.value = true
  try {
    const response = await axios.post(`${apiBase}recording`, { text: transcribedText }, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.status === 200 && !isPlaying.value) {
      const { audio: audioDataURI, aiResponse } = response.data
      chatHistory.value.push({ from: 'ai', message: aiResponse })
      await playAudio(audioDataURI)
    } else {
      console.error('Error sending audio to server')
    }
  } catch (error) {
    console.error('Error sending audio to server:', error)
  } finally {
    isInProgress.value = false
  }
}

const playAudio = async (audioDataURI: string) => {
  if (audioPlayer.value) {
    console.log('Audio received. Playing...')
    isPlaying.value = true
    try {
      const audioContext = new AudioContext()
      const response = await fetch(audioDataURI)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const source = audioContext.createBufferSource()

      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.onended = () => {
        console.log('Stop playing. Listening...')
        isPlaying.value = false
        isRecording.value = true
        startListening()
      }
      source.start()
      audioPlayer.value.src = audioDataURI
      await audioPlayer.value.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }
}
</script>