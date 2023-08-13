import MessageUser, { TMessage } from "./message-user";

class LiveMediaStreamServer extends MessageUser {
    private readonly stream: MediaStream
    private readonly track: 'track' | 'sub-track'
    private pc: RTCPeerConnection | null = null
    private client: string | null = null
    constructor(channel: string, stream: MediaStream, track: 'track' | 'sub-track') {
        super(channel)
        this.stream = stream
        this.track = track
    }

    private init(client: string, pc: RTCPeerConnection) {
        this.on('answer', msg => {
            pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp })
        })

        pc.onicecandidate = e => {
            const data = {
                candidate: undefined,
                sdpMid: null,
                sdpMLineIndex: null,
            } as TMessage['candidate']
            if (e.candidate) {
                data.candidate = e.candidate.candidate
                data.sdpMid = e.candidate.sdpMid
                data.sdpMLineIndex = e.candidate.sdpMLineIndex
            } else {
                data.sdpMLineIndex = 0
            }
            this.sendTo(client, 'candidate', data)
        };
        this.stream.getTracks().forEach(track => {
            pc.addTrack(track)
        })
    }

    async start(client: string) {
        this.client = client
        this.pc = new RTCPeerConnection()
        this.init(this.client, this.pc)

        const offer = await this.pc.createOffer()
        await this.pc.setLocalDescription(offer)

        this.sendTo(this.client, 'offer', {
            sdp: offer.sdp || ''
        })
    }

    getMediaStreamId() {
        return this.stream.id
    }

    destroy(): void {
        this.pc && this.pc.close()
        super.destroy()
    }
}

export class Room extends MessageUser {

    private readonly streams: LiveMediaStreamServer[]
    private readonly users: string[]

    constructor(channel: string) {
        super(channel)
        this.streams = []
        this.users = []

        this.on('join', ({ user }) => {
            this.users.push(user)
        })
    }

    create() {
        this.sendToAll('create', { user: this.getId() })
    }

    broadcast(stream: MediaStream, track: 'track' | 'sub-track') {
        this.users.forEach(async user => {
            const liveStream = new LiveMediaStreamServer(this.getChannel(), stream, track)
            liveStream.on('reply-media', msg => {
                liveStream.start(msg.client)
            })
            this.sendTo(user, 'call-media', {
                track,
                server: liveStream.getId()
            })
        })
    }
}

class LiveMediaStreamClient extends MessageUser {
    private readonly pc: RTCPeerConnection
    private readonly track: 'track' | 'sub-track'
    private readonly server: string;
    constructor(channel: string, server: string, track: 'track' | 'sub-track') {
        super(channel)

        // this.addBaseListener(msg => {
        //     console.log(999999, this.getId(), msg)
        // })

        this.server = server
        this.track = track

        const pc = new RTCPeerConnection()
        pc.ontrack = ev => {
            let stream: MediaStream
            if (Array.isArray(ev.streams) && ev.streams.length > 0) {
                stream = ev.streams[0]
            } else {
                stream = new MediaStream()
                stream.addTrack(ev.track)
            }
            this.triggerEvent(this.track, stream)
        }

        this.on('offer', async ({ sdp }) => {
            await this.pc.setRemoteDescription({ type: 'offer', sdp })
            const answer = await this.pc.createAnswer()
            await this.pc.setLocalDescription(answer)
            this.sendTo(this.server, 'answer', { sdp: answer.sdp || '' })
        })

        this.on('candidate', msg => {
            const {
                candidate,
                sdpMLineIndex,
                sdpMid
            } = msg
            pc.addIceCandidate({ candidate, sdpMid, sdpMLineIndex })
        })

        this.pc = pc
    }

    onTrack(stream: MediaStream) { }

    getServerId() {
        return this.server
    }
}

export class Client extends MessageUser {
    private readonly streams: LiveMediaStreamClient[]
    constructor(channel: string) {
        super(channel)
        this.streams = []
        this.init()
    }
    private init() {
        this.on('call-media', msg => {
            const client = new LiveMediaStreamClient(this.getChannel(), msg.server, msg.track)
            this.sendTo(msg.server, 'reply-media', {
                client: client.getId(),
            })
            client.on('track', msg => {
                this.triggerEvent('track', msg)
            })
            client.on('sub-track', msg => {
                this.triggerEvent('sub-track', msg)
            })
        })
    }
    join(user: string) {
        this.sendTo(user, 'join', { user: this.getId() })
    }
}