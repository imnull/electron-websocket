import { useEffect, useState } from "react"
import { Room, Client } from '../lib/room'

export default () => {

    const [text, setText] = useState('')

    const [mainVideo, setMainVideo] = useState<HTMLVideoElement | null>(null)
    const [subVideo, setSubVideo] = useState<HTMLVideoElement | null>(null)
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
    // const [canvas2, setCanvas2] = useState<HTMLCanvasElement | null>(null)
    const [channel, setChannel] = useState('')
    const [room, setRoom] = useState<Room | null>(null)
    const [swi, setSwi] = useState<number>(-1)

    useEffect(() => {
        if (!canvas) {
            return
        }

        const ctx = canvas.getContext('2d')!
        // const ctx2 = canvas2.getContext('2d')!
        ctx.scale(2.5, 2.5)
        // ctx2.scale(2.5, 2.5)

        let h = 0
        h = setInterval(() => {
            ctx.fillStyle = '#f1f1f1'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#a00'
            ctx.fillText(new Date().toString(), 20, 50)

            // ctx2.fillStyle = '#f1f1f1'
            // ctx2.fillRect(0, 0, canvas2.width, canvas2.height)
            // ctx2.fillStyle = '#00a'
            // ctx2.fillText(new Date().toString(), 20, 50)
        }, 100)



        const room = new Room('abc')
        room.on('connect', msg => {
            console.log(22222, 'server', msg)
        })
        room.create()

        setRoom(room)

        setTimeout(() => {
            

            // const stream2 = canvas2.captureStream(10)
            // room.broadcast(stream2, 'sub-track')

            // setTimeout(() => {
            //     navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {

            //         const tracks = [stream.getTracks(), mainStream.getTracks()].flat(1)
            //         console.log(tracks)
            //         const str = new MediaStream()
            //         tracks.forEach(track => {
            //             str.addTrack(track)
            //         })
            //         console.log(str.getTracks())
            //         room.broadcast(stream)

            //         // const video = document.createElement('video')
            //         // video.width = 640
            //         // video.height = 480
            //         // video.srcObject = stream
            //         // video.play()


            //         // video.ontimeupdate = ev => {
            //         //     const { width, height } = video.getBoundingClientRect()
            //         //     ctx.fillStyle = '#f1f1f1'
            //         //     ctx.fillRect(0, 0, canvas.width, canvas.height)
            //         //     ctx.fillStyle = '#a00'
            //         //     ctx.fillText(new Date().toString(), 20, 50)
            //         //     ctx.drawImage(video, 0, 0, 640, 480, 3, 3, 80, 60)
            //         // }
            //     })
            // }, 5000)
            setSwi(0)
        }, 100)

        return () => {
            clearInterval(h)
        }

    }, [canvas])

    useEffect(() => {
        if(!canvas || !room || swi < 0) {
            return
        }
        if(swi === 0) {
            const mainStream = canvas.captureStream(10)
            room.broadcast(mainStream)
        } else if(swi === 1) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
                room.broadcast(stream)
            })
        }
    }, [swi, canvas, room])

    useEffect(() => {
        if (!channel || !mainVideo || !subVideo) {
            return
        }
        const client = new Client(channel)
        client.on('create', ({ user }) => {
            client.connect(user)
        })
        client.on('track', stream => {
            console.log(22222222, stream.getTracks())
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
            {/* <canvas width={720} height={480} ref={setCanvas2} /> */}
        </> : null}
        {canvas && room ? <button onClick={() => {
            setSwi((swi + 1) % 2)
        }}>switch</button> : null}
        {channel ? <>
            <h1>Client</h1>
            <video autoPlay controls ref={setMainVideo} />
            <video autoPlay controls ref={setSubVideo} />
        </> : null}
    </>
}