import { useEffect } from "react"

const WS_URL = (window as any)['WEBSOCKET_URL'] || 'ws://localhost:9010';

export default () => {

    useEffect(() => {
        const uri = new URL(WS_URL)
        console.log(uri)
        const wsUrl = `ws://${uri.hostname}:${uri.port}`
        console.log(wsUrl)
        const ws = new WebSocket(wsUrl)
        ws.onmessage = (ev) => {
            const json = ev.data + ''
            const data = JSON.parse(json)
            console.log(data)
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'hello', data: { name: 'MK' } }))
        }

    }, [])

    return <h1>Hello World</h1>
}