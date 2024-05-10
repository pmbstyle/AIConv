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
            <div class="w-24 rounded-full ring ring-offset-base-100 ring-offset-2" :class="{'ring-success':isRecording}">
              <img :src="UserAvatar" />
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 rounded-lg flex items-center justify-center mt-6">
        <button
          class="btn"
          :class="{'btn-success':isRecording, 'btn-error': !isRecording}"
          @click="toggleRecording">
            Recording
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
  import { ref, onMounted } from 'vue'
  import axios from 'axios'

  import AiAvatar from '@/assets/images/ai-avatar.png'
  import UserAvatar from '@/assets/images/user-avatar.png'

  const isRecording = ref(false)
  let mediaRecorder: MediaRecorder | null = null
  const chunks: Blob[] = []
  const audioPlayer = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref<boolean>(false)
  const isInProgress = ref<boolean>(false)
  const chatHistory = ref<object[]>([])

  const toggleRecording = async () => {
    if (isRecording.value) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        sendAudioToServer(blob)
        chunks.length = 0
      }
      mediaRecorder.start()
      isRecording.value = true
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      isRecording.value = false
    }
  }

  const sendAudioToServer = async (blob: Blob) => {
    isInProgress.value = true
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await axios.post('http://localhost:3000/recording', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status === 200) {
        const audioDataURI = response.data.audio
        playAudio(audioDataURI)
        chatHistory.value.push({ from:'user', message:response.data.userMessage })
        chatHistory.value.push({ from:'ai', message:response.data.aiResponse })
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
            isPlaying.value = false
          }
          source.start()
          audioPlayer.value.src = audioDataURI
          audioPlayer.value.play()
        })
        .catch((error) => console.error('Error playing audio:', error))
    }
  }
</script>
