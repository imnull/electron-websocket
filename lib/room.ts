import MessageUser, { TMessage } from "./message-user";

class LiveMediaStreamServer extends MessageUser {
    private pc: RTCPeerConnection
    private client: string
    constructor(channel: string, stream: MediaStream) {
        super(channel)
        this.pc = new RTCPeerConnection()
        this.client = ''
    }



    async offer(stream: MediaStream) {

        const pc = this.pc

        if(!pc.remoteDescription) {
    
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
                this.sendTo(this.client, 'candidate', data)
            }
            this.once('answer', msg => {
                pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp })
            })
    
            stream.getTracks().forEach(track => {
                pc.addTrack(track)
            })
            const offer = await pc.createOffer({
                iceRestart: true
            })
            await pc.setLocalDescription(offer)
    
            this.sendTo(this.client, 'offer', {
                sdp: offer.sdp || ''
            })
        } else {
            pc.getSenders().forEach(sender => {
                pc.removeTrack(sender)
            })
            stream.getTracks().forEach(track => {
                pc.addTrack(track)
            })
            const offer = await pc.createOffer({
                iceRestart: true
            })
            await pc.setLocalDescription(offer)
    
            this.sendTo(this.client, 'offer', {
                sdp: offer.sdp || ''
            })
        }
    }

    connect(client: string) {
        this.client = client
    }

    destroy(): void {
        this.pc && this.pc.close()
        super.destroy()
    }
}

export class Room extends MessageUser {

    private readonly streams: LiveMediaStreamServer[]
    private readonly users: string[]
    private readonly mainStream: MediaStream

    constructor(channel: string) {
        super(channel)
        this.streams = []
        this.users = []
        this.mainStream = new MediaStream()
        this.mainStream.addEventListener('addtrack', ev => {
            console.log(11122222, ev)
        })

        this.on('connect', ({ user }) => {
            this.users.push(user)
            const mainStream = new LiveMediaStreamServer(this.getChannel(), this.mainStream)
            this.streams.push(mainStream)
            mainStream.on('reply-media', msg => {
                mainStream.connect(msg.client)
            })
            this.sendTo(user, 'call-media', {
                server: mainStream.getId()
            })
        })
    }

    create() {
        this.sendToAll('create', { user: this.getId() })
    }

    broadcast(stream: MediaStream) {
        // stream.getTracks().forEach(track => {
        //     this.mainStream.addTrack(track)
        // })
        this.streams.forEach(str => {
            str.offer(stream)
        })
        // this.users.forEach(async user => {
        //     const liveStream = new LiveMediaStreamServer(this.getChannel(), stream, track)
        //     liveStream.on('reply-media', msg => {
        //         liveStream.start(msg.client)
        //     })
        //     this.sendTo(user, 'call-media', {
        //         track,
        //         server: liveStream.getId()
        //     })
        // })
    }
}

class LiveMediaStreamClient extends MessageUser {
    private readonly pc: RTCPeerConnection
    private readonly server: string;
    constructor(channel: string, server: string) {
        super(channel)
        this.server = server
        this.pc = new RTCPeerConnection()

        this.init()

    }

    private init() {
        this.pc.ontrack = ev => {
            let stream: MediaStream
            if (Array.isArray(ev.streams) && ev.streams.length > 0) {
                stream = ev.streams[0]
            } else {
                stream = new MediaStream()
                stream.addTrack(ev.track)
            }
            this.triggerEvent('track', stream)
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
            this.pc.addIceCandidate({ candidate, sdpMid, sdpMLineIndex })
        })
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
            const client = new LiveMediaStreamClient(this.getChannel(), msg.server)
            this.sendTo(msg.server, 'reply-media', {
                client: client.getId(),
            })
            client.on('track', msg => {
                this.triggerEvent('track', msg)
            })
        })
    }
    connect(user: string) {
        this.sendTo(user, 'connect', { user: this.getId() })
    }
}