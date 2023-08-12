import { IdObject } from "./utils"
import EventBus from "./event-bus"

export type TMessage<T> = ({
    access: 'public';
    exclude?: string[];
} | {
    access: 'private';
    receiver: string;
}) & { data: T }

export default class Passager<T = any> extends IdObject {

    private readonly channel: BroadcastChannel
    private readonly bus: EventBus

    constructor(channel: string) {
        super()
        this.bus = new EventBus()
        this.channel = new BroadcastChannel(channel)
        this.channel.onmessage = ev => {
            const { access, sender, receiver, exclude } = ev.data

            if(!sender || sender === this.getId()) {
                return
            }

            if(access === 'public') {
                if(!Array.isArray(exclude) || !exclude.includes(this.getId())) {
                    this.bus.emit('message', ev.data)
                }
            } else if(access === 'private' && receiver === this.getId()) {
                this.bus.emit('message', ev.data)
            }
        }
    }

    addListener(callback: (message: TMessage<T>) => void) {
        return this.bus.on('message', callback)
    }

    postMessage(message: TMessage<T>) {
        const { access, data } = message
        const msg: any = { access, data, sender: this.getId() }
        if(access === 'public') {
            const { exclude } = message
            if(Array.isArray(exclude) && exclude.length > 0) {
                msg.exclude = exclude
            }
        } else if(access === 'private') {
            const { receiver } = message
            msg.receiver = receiver
        }
        this.channel.postMessage(msg)
    }

    sendToAll(data: T, exclude: string[] = []) {
        this.postMessage({ access: 'public', exclude, data })
    }
    sendTo(data: T, receiver: string) {
        this.postMessage({ access: 'private', receiver, data })
    }
}