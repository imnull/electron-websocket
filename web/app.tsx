import { useEffect, useState } from "react"

import { LiveMediaServer, LiveMediaClient } from './signaling'

export default () => {

    const [text, setText] = useState('')

    const [video, setVideo] = useState<HTMLVideoElement | null>(null)
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
    const [channel, setChannel] = useState('')

    // useEffect(() => {
    //     if (!video) {
    //         return
    //     }
    //     const uri = new URL(location.href)
    //     const channel = uri.searchParams.get('channel')
    //     if (!channel) {
    //         const stream = video.captureStream(25)
    //         const server = new LiveMediaServer('abc')
    //         const ch = server.broadcast(stream)
    //         const url = `${uri.protocol}//${uri.host}${uri.pathname}?channel=${ch}`
    //         console.log(1111, url)
    //     } else {
    //         setChannel(channel)
    //     }
    //     video.oncanplay = ev => {
    //         console.log(22222, ev)
    //         // video.play()
    //     }
    // }, [video])

    useEffect(() => {
        if (!canvas) {
            return
        }
        const uri = new URL(location.href)
        const channel = uri.searchParams.get('channel')
        if (!channel) {

            const ctx = canvas.getContext('2d')!
            ctx.scale(2.5, 2.5)
            const h = setInterval(() => {
                ctx.fillStyle = '#f1f1f1'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = '#000'
                ctx.fillText(new Date().toString(), 20, 50)
            }, 100)

            // navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
            //     const server = new LiveMediaServer('abc')
            //     const ch = server.broadcast(stream)
            //     console.log('Channel:', ch)
            // })

            const stream = canvas.captureStream(10)

            const server = new LiveMediaServer('abc')
            server.broadcast(stream)
            const server2 = new LiveMediaServer('abcd')
            server2.broadcast(stream)
            

            return () => {
                clearInterval(h)
            }
        } else {
            setChannel(channel)
        }
    }, [canvas])

    // useEffect(() => {
    //     if (!canvas) {
    //         return
    //     }
    //     const ctx = canvas.getContext('2d')!
    //     ctx.scale(2.5, 2.5)
    //     const h = setInterval(() => {
    //         ctx.fillStyle = '#f1f1f1'
    //         ctx.fillRect(0, 0, canvas.width, canvas.height)
    //         ctx.fillStyle = '#000'
    //         ctx.fillText(new Date().toString(), 20, 50)
    //     }, 100)
    //     return () => {
    //         clearInterval(h)
    //     }
    // }, [canvas])


    return <>
        <h1>Hello World</h1>
        {!channel ? <canvas width={720} height={480} ref={setCanvas} /> : null}
        {channel ? <button onClick={() => {
            const client = new LiveMediaClient(channel)
            client.onTrack = mediaStream => {
                const video = document.createElement('video')
                video.style.cssText = 'border:1px solid #aaa;'
                document.body.appendChild(video)
                video.srcObject = mediaStream
                video.play()
            }
            client.hi()
        }}>Say Hi</button> : null}
    </>
}