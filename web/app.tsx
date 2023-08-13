import { useEffect, useState } from "react"
import { Room, Client } from '../lib/room'

export default () => {

    const [text, setText] = useState('')

    const [mainVideo, setMainVideo] = useState<HTMLVideoElement | null>(null)
    const [subVideo, setSubVideo] = useState<HTMLVideoElement | null>(null)
    const [localVideo, setLocalVideo] = useState<HTMLVideoElement | null>(null)
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
    const [channel, setChannel] = useState('')

    useEffect(() => {
        if (!canvas || !localVideo) {
            return
        }

        const ctx = canvas.getContext('2d')!
        ctx.scale(2.5, 2.5)
        const h = setInterval(() => {
            ctx.fillStyle = '#f1f1f1'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#000'
            ctx.fillText(new Date().toString(), 20, 50)
        }, 100)


        const room = new Room('abc')
        room.on('join', msg => {
            console.log(22222, msg)
        })
        room.create()

        setTimeout(() => {
            const stream = canvas.captureStream(10)
            room.broadcast(stream, 'track')
        }, 1000)


        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {

            localVideo.srcObject = stream

            const room = new Room('abc')
            room.on('join', msg => {
                console.log(22222, msg)
            })
            room.create()

            setTimeout(() => {
                console.log(room)
                room.broadcast(stream, 'sub-track')
            }, 1000)
        })

    }, [canvas, localVideo])

    useEffect(() => {
        if (!channel || !mainVideo || !subVideo) {
            return
        }
        const client = new Client(channel)
        client.on('create', ({ user }) => {
            client.join(user)
        })
        client.on('track', stream => {
            mainVideo.srcObject = stream
        })
        client.on('sub-track', stream => {
            subVideo.srcObject = stream
        })
    }, [channel, mainVideo, subVideo])

    useEffect(() => {
        const uri = new URL(location.href)
        const channel = uri.searchParams.get('channel')
        setChannel(channel || '')
    }, [])

    return <>
        {!channel ? <>
            <h1>Server</h1>
            <canvas width={720} height={480} ref={setCanvas} />
            <video autoPlay controls ref={setLocalVideo} />
        </> : null}
        {channel ? <>
            <h1>Client</h1>
            <video autoPlay controls ref={setMainVideo} />
            <video autoPlay controls ref={setSubVideo} />
        </> : null}
    </>
}