import { useEffect, useState } from "react"

const WS_URL = (window as any)['WEBSOCKET_URL'] || 'ws://localhost:9010';

export default () => {

    const [text, setText] = useState('')

    useEffect(() => {
        const uri = new URL(WS_URL)
        console.log(uri)
        const wsUrl = `ws://${uri.hostname}:${uri.port}`
        console.log(wsUrl)
        const ws = new WebSocket(wsUrl)
        ws.onmessage = (ev) => {
            const json = ev.data + ''
            const data = JSON.parse(json)
            if(data.type === 'hello') {
                const { text } = data.data
                console.log(data, text)
                setText(text)
            }
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'hello', data: { name: 'MK' } }))
        }

    }, [])

    return <>
        <h1>Hello World</h1>
        <h3>{text}</h3>
    </>
}