import { useEffect, useState } from "react"

import { LiveMediaServer, LiveMediaClient } from './signaling'
import { Messager, Room, User } from "./messager"

export default () => {

    const [text, setText] = useState('')

    const [video, setVideo] = useState<HTMLVideoElement | null>(null)
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
    const [channel, setChannel] = useState('')
    const [messager, setMessager] = useState<Messager | null>(null)
    const [room, setRoom] = useState<Room | null>(null)

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

            // const stream = canvas.captureStream(10)

            // const server = new LiveMediaServer('abc')
            // server.broadcast(stream)
            // const server2 = new LiveMediaServer('abcd')
            // server2.broadcast(stream)
            // return () => {
            //     clearInterval(h)
            // }
        } else {
            setChannel(channel)
        }
    }, [canvas])

    useEffect(() => {
        if(!video) {
            return
        }
        const uri = new URL(location.href)
        const channel = uri.searchParams.get('channel')
        if (!channel) {
            const room = new Room('xyz')
            room.onRequest = msg => {
                console.log('room.onRequest', msg)
            }
            room.onResponse = msg => {
                console.log('room.onResponse', msg)
            }
            setRoom(room)
        } else {
            const user = new User()
            const messager = user.connect('xyz')
            messager.onMessage = msg => {
                console.log('messager.onMessage', msg)
            }
            messager.listenBroadcast(stream => {
                video.srcObject = stream
            })

            messager.join()
            setMessager(messager)
        }
    }, [video])

    return <>
        <h1>Hello World</h1>
        {!channel ? <canvas width={720} height={480} ref={setCanvas} /> : null}
        {canvas && room ? <button onClick={() => {
            const stream = canvas.captureStream(10)
            room.broadcast(stream)
        }}>Say Hi</button> : null}
        <video controls ref={setVideo} />
        <div>
            {messager ? <>
                <button onClick={() => {
                    messager.send('hello')
                }}>Hello</button>
                <button onClick={() => {
                    messager.join().then(() => {
                        console.log(33333)
                    })
                }}>Join</button>
                <button onClick={() => {
                    messager.send('list-user')
                }}>List</button>
                <button onClick={() => {
                    messager.say('Hello everybody~!')
                }}>Say hello to all</button>
                <button onClick={() => {
                    messager.exit().then(() => {
                        console.log(44444)
                    })
                }}>Exit</button>
            </> : null}
        </div>
    </>
}