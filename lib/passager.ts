import { IdObject } from "./utils"
import EventBus from "./event-bus"

export abstract class MessageResolver<M = any> extends IdObject {
    

    static GetMessageName() {
        return '--message--'
    }

    static IsInvalidMessageName(name: string) {
        return name == MessageResolver.GetMessageName()
    }

    private readonly channel: BroadcastChannel
    private readonly bus: EventBus

    constructor(channel: string) {
        super()
        this.channel = new BroadcastChannel(channel)
        this.bus = new EventBus()

        this.channel.onmessage = ev => {
            const { type, data } = ev.data
            if(type === MessageResolver.GetMessageName()) {
                this.bus.emit(type, data)
            }
        }

    }
    protected addBaseListener(callback: (message: M) => void) {
        return this.bus.on(MessageResolver.GetMessageName(), callback)
    }

    protected postBaseMessage(message: M) {
        this.channel.postMessage({ type: MessageResolver.GetMessageName(), data: message })
    }

    protected triggerEvent(type: string, data: any) {
        this.bus.emit(type, data)
    }

    getChannel() {
        return this.channel.name
    }

    on(type: string, callback: (data: any) => void) {
        if (MessageResolver.IsInvalidMessageName(type)) {
            throw `The event name "${type}" can not be use.`
        }
        this.bus.on(type, callback)
    }
    once(type: string, callback: (data: any) => void) {
        if (MessageResolver.IsInvalidMessageName(type)) {
            throw `The event name "${type}" can not be use.`
        }
        this.bus.on(type, callback)
    }

    destroy() {
        this.channel.close()
        this.bus.clear()
    }
}

export type TMessage<T extends string = string, D = any> = ({
    access: 'public';
    exclude?: string[];
} | {
    access: 'private';
    receiver: string;
}) & { type: T; data: D }

export default class Passager<D = any, T extends string = string> extends MessageResolver<TMessage<T, D>> {

    private readonly bridges: Record<T, Passager<D, T>[]>

    constructor(channel: string) {
        super(channel)
        this.bridges = {} as Record<T, Passager<D, T>[]>
        this.addBaseListener(msg => {
            const { access, type, data } = msg
            if (access === 'public') {
                const { exclude } = msg
                if (!Array.isArray(exclude) || !exclude.includes(this.getId())) {
                    this.triggerEvent(type, data)
                }
            } else if (access === 'private') {
                if (msg.receiver === this.getId()) {
                    this.triggerEvent(type, data)
                }
            }
        })
    }

    protected triggerEvent(type: T, data: any): void {
        if(Array.isArray(this.bridges[type]) && this.bridges[type].length > 0) {
            this.bridges[type].forEach(passager => {
                passager.triggerEvent(type, data)
            })
        } else {
            super.triggerEvent(type, data)
        }
    }

    bridge(passager: Passager<D, T>, types: T[]) {
        if(passager === this || passager.getChannel() !== this.getChannel()) {
            return false
        }
        types.forEach(type => {
            if(!Array.isArray(this.bridges[type])) {
                this.bridges[type] = []
            }
            this.bridges[type].push(passager)
        })
        return true
    }

    sendToAll(type: T, data: D, exclude: string[] = []) {
        const message: TMessage<T, D> = { type, data, access: 'public', exclude }
        this.postBaseMessage(message)
    }
    sendTo(receiver: string, type: T, data: D) {
        const message: TMessage<T, D> = { type, data, access: 'private', receiver }
        this.postBaseMessage(message)
    }
}