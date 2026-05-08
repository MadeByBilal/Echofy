import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', {
  withCredentials: true,
  autoConnect: false     // don't connect until user logs in
})

export default socket