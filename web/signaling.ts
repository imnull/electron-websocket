let EVENTBUS_ID = 0
export class EventBusNS<D = any> {

    private readonly listeners: { id: number; type: string; callback: (ev: any) => void; ns: string | (() => string) }[]
    constructor() {
        this.listeners = []
    }
    on(ns: string | (() => string), type: string, callback: (ev: D) => void) {
        const id = ++EVENTBUS_ID
        this.listeners.push({ id, type, callback, ns })
        return id
    }
    emit(ns: string, typeName: string, data: D) {
        this.listeners.forEach(({ type, callback, ns: _ns }) => {
            if(typeof _ns === 'function') {
                _ns = _ns()
            }
            if((_ns === '*' || ns === _ns) && typeName === type) {
                callback(data)
            }
        })
    }
}

type TMessage = {
    type: 'hi'
    client: string
} | {
    type: 'candidate'
    candidate?: string
    sdpMid?: string | null
    sdpMLineIndex?: number | null
} | {
    type: 'offer'
    server: string
    sdp: string
} | {
    type: 'answer'
    sdp: string
} | {
    type: 'error'
    error: string
}


const uuid = () => {
    const len = 36
    const arr = Array(len).fill(0)
    const str = '0123456789ABCDEF'
    const prefix = Date.now().toString(16).toUpperCase()
    const right = len - prefix.length
    prefix.split('').forEach((c, i) => arr[i] = c)
    for (let i = prefix.length; i < arr.length; i++) {
        arr[i] = str.charAt(str.length * Math.random() >> 0)
    }
    return arr.join('')
}

class P2PUser {
    private readonly id: string
    private readonly role: 'server' | 'client';
    private remote: string;
    constructor(role: 'server' | 'client') {
        this.id = uuid()
        this.remote = ''
        this.role = role
    }
    getId() {
        return this.id
    }
    getNS() {
        if (!this.remote) {
            return this.getId()
        }
        if (this.role === 'server') {
            return `${this.getId()}:${this.remote}`
        } else {
            return `${this.remote}:${this.getId()}`
        }
    }
    setRemote(remote: string) {
        this.remote = remote
    }
    hasRemoted() {
        return !!this.remote
    }
}

const BroadcastChannelClusterMap: Record<string, BroadcastChannelCluster> = {}

class BroadcastChannelCluster {

    static Create(channel: string) {
        if (channel in BroadcastChannelClusterMap) {
            return BroadcastChannelClusterMap[channel]
        } else {
            const cluster = new BroadcastChannelCluster(channel)
            BroadcastChannelClusterMap[channel] = cluster
            return cluster
        }
    }

    private readonly signaling: BroadcastChannel
    private readonly events: EventBusNS<TMessage>
    private readonly users: P2PUser[]
    constructor(channel: string) {
        this.signaling = new BroadcastChannel(channel)
        this.events = new EventBusNS()
        this.users = []

        this.signaling.onmessage = ev => {
            const { ns, msg } = ev.data
            this.events.emit(ns, msg.type, msg)
        }
    }

    getChannelName() {
        return this.signaling.name
    }

    appendUser(user: P2PUser) {
        this.users.push(user)
    }

    on(user: P2PUser | '*', type: TMessage['type'], callback: (data: TMessage) => void) {
        this.events.on(user === '*' ? user : () => user.getNS(), type, callback)
    }

    send(user: P2PUser, msg: TMessage) {
        const ns = user.getNS()
        this.signaling.postMessage({ ns, msg })
    }
}

class LiveChannel extends P2PUser {
    private readonly channel: BroadcastChannelCluster
    constructor(channel: string, role: 'server' | 'client') {
        super(role)
        this.channel = BroadcastChannelCluster.Create(channel)
    }

    on(type: Parameters<typeof callback>[0]['type'], callback: (msg: TMessage) => void, all: boolean = false) {
        this.channel.on(all ? '*' : this, type, callback)
    }
    send(msg: TMessage) {
        this.channel.send(this, msg)
    }
}

export class LiveMediaServer {
    private readonly channel: string
    constructor(channel: string = uuid()) {
        this.channel = channel
    }

    async createServer(stream: MediaStream, client: string) {
        const channelUser = new LiveChannel(this.channel, 'server')
        channelUser.setRemote(client)

        const peer = new RTCPeerConnection()
        peer.onicecandidate = e => {
            const message: TMessage = {
                type: 'candidate',
            };
            if (e.candidate) {
                message.candidate = e.candidate.candidate || undefined
                message.sdpMid = e.candidate.sdpMid
                message.sdpMLineIndex = e.candidate.sdpMLineIndex
            } else {
                message.sdpMLineIndex = 0
            }
            // signaling.postMessage(message)
            channelUser.send(message)
        };
        stream.getTracks().forEach(track => {
            peer.addTrack(track)
        })

        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)

        channelUser.on('answer', async msg => {
            const { sdp = '' } = msg as any
            await peer.setRemoteDescription({ type: 'answer', sdp })
        })

        const message: TMessage = {
            type: 'offer',
            server: channelUser.getId(),
            sdp: offer.sdp || ''
        }
        channelUser.send(message)
    }

    broadcast(stream: MediaStream) {
        const daemon = new LiveChannel(this.channel, 'server')
        daemon.on('hi', async msg => {
            const { client } = msg as any
            this.createServer(stream, client)
        }, true)
    }
}

export class LiveMediaClient {
    private readonly channel: string
    constructor(channel: string) {
        this.channel = channel
    }

    onTrack(ev: MediaStream) { }

    hi() {
        const channel = new LiveChannel(this.channel, 'client')
        const peer = new RTCPeerConnection();

        channel.on('offer', async msg => {

            if(channel.hasRemoted()) {
                return
            }

            const { sdp, server } = msg as any
            channel.setRemote(server)

            await peer.setRemoteDescription({ type: 'offer', sdp })
            const answer = await peer.createAnswer()
            await peer.setLocalDescription(answer)

            const message: TMessage = {
                type: 'answer',
                sdp: answer.sdp || '',
            }
            channel.send(message)
        }, true)

        channel.on('candidate', async msg => {
            const { candidate, sdpMLineIndex, sdpMid } = msg as any
            await peer.addIceCandidate({ candidate, sdpMLineIndex, sdpMid })
        })

        peer.ontrack = ev => {
            if (Array.isArray(ev.streams) && ev.streams.length > 0) {
                this.onTrack(ev.streams[0])
            } else {
                const inboundStream = new MediaStream();
                inboundStream.addTrack(ev.track);
                this.onTrack(inboundStream)
            }
        }
        const msg: TMessage = { type: 'hi', client: channel.getId() }
        channel.send(msg)
    }
}
