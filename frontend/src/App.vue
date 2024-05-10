<template>
  <div class="bg-gray-800 h-screen flex w-full items-center justify-center">
    <div class="flex flex-col container mx-auto h-full items-center justify-center">
      <div class="bg-gray-900 p-6 rounded-lg flex flex-col md:flex-row h-[50%] w-full">
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <audio ref="audioPlayer" controls class="hidden"></audio>
          <div class="avatar">
            <div class="w-24 rounded-full ring ring-offset-base-100 ring-offset-2" :class="{'ring-success':isPlaying}">
              <img :src="AiAvatar" />
            </div>
          </div>
        </div>
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <div class="avatar">
            <div class="w-24 rounded-full ring ring-offset-base-100 ring-offset-2" :class="{'ring-success':recognizedText > 0}">
              <img :src="UserAvatar" />
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 rounded-lg flex items-center justify-center mt-6">
        <button
          class="btn"
          :class="{'btn-success':isListening, 'btn-error': !isListening}"
          @click="isListening.value ? stop() : start(); detectSilence()"
          >
          {{ isListening ? 'Stop Listening' : 'Start Listening' }}
        </button>
      </div>
    </div>
    <div class="h-full w-full max-w-lg bg-gray-900 self-end px-2 py-4 overflow-y-scroll">
      <template v-if="chatHistory.length">
        <div
          class="chat mb-2"
          v-for="(m, index) in chatHistory"
          :key="index"
          :class="{'chat-start': m.from == 'ai', 'chat-end': m.from == 'user'}"
          >
          <div class="chat-image avatar">
            <div class="w-10 rounded-full">
              <img :src="m.from == 'ai'? AiAvatar : UserAvatar" />
            </div>
          </div>
          <div
            class="chat-bubble"
            :class="{'chat-bubble-primary': m.from == 'ai'}"
            >
            {{m.message}}
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
  import AiAvatar from '@/assets/images/ai-avatar.png'
  import UserAvatar from '@/assets/images/user-avatar.png'

  const { isListening, isFinal, result, start, stop } = useSpeechRecognition({
    continuous: true,
    lang: 'en-US',
  })
  const recognizedText = ref<strong>('')

  const isRecording = ref(false)
  let mediaRecorder: MediaRecorder | null = null
  const chunks: Blob[] = []
  const audioPlayer = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref<boolean>(false)
  const isInProgress = ref<boolean>(false)
  const chatHistory = ref<object[]>([])

  watch(
    result,
    (newResult) => {
      recognizedText.value = newResult
      console.log('recognizedText:', recognizedText.value)
    },
    { immediate: true }
  )

  const detectSilence = async () => {
    console.log('Starting detecting silence.')
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    let silenceCounter = 0
    const silenceThreshold = 100

    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray)
      const isSilent = dataArray.every((value) => value < silenceThreshold)

      if (isSilent) {
        silenceCounter++
      } else {
        silenceCounter = 0
      }

      if (silenceCounter > 250) {
        console.log(`Silence detected for the last ${silenceCounter} frames. Stopping recognition and sending transcription to server.`)
        stop()
        sendAudioToServer(recognizedText.value)
        recognizedText.value = ''
        silenceCounter = 0
      } else {
        requestAnimationFrame(checkSilence)
      }
    }

    checkSilence()
  }

  const sendAudioToServer = async (transcribedText) => {
    isInProgress.value = true
    try {
      const response = await axios.post('http://localhost:3000/recording', { text: transcribedText }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 200) {
        const audioDataURI = response.data.audio
        playAudio(audioDataURI)
        chatHistory.value.push({ from: 'user', message: transcribedText })
        chatHistory.value.push({ from: 'ai', message: response.data.aiResponse })
      } else {
        console.error('Error sending audio to server')
      }
      isInProgress.value = false
    } catch (error) {
      console.error('Error sending audio to server:', error)
      isInProgress.value = false
    }
  }

  const playAudio = (audioDataURI: string) => {
    if (audioPlayer.value) {
      console.log('Audio received. Playing...')
      isPlaying.value = true
      const audioContext = new AudioContext()
      fetch(audioDataURI)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          const source = audioContext.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioContext.destination)
          source.onended = () => {
            console.log('Stop playing. Listening...')
            isPlaying.value = false
            start()
            detectSilence()
          }
          source.start()
          audioPlayer.value.src = audioDataURI
          audioPlayer.value.play()
        })
        .catch((error) => console.error('Error playing audio:', error))
    }
  }
</script>
