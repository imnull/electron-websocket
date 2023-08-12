import Passager from "./passager";
import EventBus from "./event-bus";
import { IdObject, uuid } from './utils'

type TMessage = {
    'create': {
        user: string;
    };
    'join': {
        user: string;
    };
    'broadcast': {
        connectId: string;
        sdp: string;
        sender: string;
    };
    'candidate': {
        connectId: string;
        candidate?: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
    };
    'answer': {
        connectId: string;
        sdp: string;
    };
}

export type TUserMessage<T extends keyof TMessage> = {
    type: T;
    data: TMessage[T]
}

export class MessageUser<T = any> {
    protected readonly passager: Passager<T>
    protected readonly bus: EventBus
    constructor(channel: string) {
        this.bus = new EventBus()
        this.passager = new Passager(channel)
        this.passager.addListener(message => {
            const { data } = message
            this.bus.emit((data as any).type, (data as any).data)
        })
    }
    
    on(type: 'create', callback: (msg: TMessage['create']) => void): void;
    on(type: 'join', callback: (msg: TMessage['join']) => void): void;
    on(type: 'broadcast', callback: (msg: TMessage['broadcast']) => void): void;
    on(type: 'candidate', callback: (msg: TMessage['candidate']) => void): void;
    on(type: 'answer', callback: (msg: TMessage['answer']) => void): void;
    on(type: any, callback: (msg: any) => void) {
        this.bus.on(type, callback)
    }

    protected publish(data: any) {
        this.passager.postMessage({ access: 'public', data })
    }

    speakTo(receiver: string, data: any) {
        this.passager.postMessage({ access: 'private', receiver, data })
    }
}

export class Room extends MessageUser {

    private readonly peers: { id: string; pc: RTCPeerConnection }[]
    private readonly users: string[]

    constructor(channel: string) {
        super(channel)
        this.peers = []
        this.users = []

        this.on('join', ({ user }) => {
            this.users.push(user)
        })

        this.on('answer', ({ connectId, sdp }) => {
            const peer = this.peers.find(it => it.id === connectId)
            if(peer) {
                peer.pc.setRemoteDescription({ type: 'answer', sdp })
            }
        })
    }

    create() {
        const msg = { type: 'create', data: { user: this.passager.getId() } } as TUserMessage<'create'>
        this.publish(msg)
    }

    broadcast(stream: MediaStream) {
        this.users.forEach(async user => {
            const connectId = uuid()
            const pc = new RTCPeerConnection()
            this.peers.push({ id: connectId, pc })

            pc.onicecandidate = e => {
                const data = {
                    connectId,
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
                this.speakTo(user, { type: 'candidate', data })
            };
            stream.getTracks().forEach(track => {
                pc.addTrack(track)
            })

            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)

            const data = { connectId, sdp: offer.sdp, sender: this.passager.getId() } as TMessage['broadcast']
            this.speakTo(user, {
                type: 'broadcast',
                data,
            })
        })
    }
}

export class Client extends MessageUser {

    join(user: string) {
        const msg = { type: 'join', data: { user: this.passager.getId() } } as TUserMessage<'join'>
        this.speakTo(user, msg)
    }
}