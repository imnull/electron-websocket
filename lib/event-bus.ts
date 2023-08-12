import { uuid } from "./utils";

export default class EventBus {
    private readonly listeners: { id: number; type: string; callback: (ev: any) => void; count: number; limit: number; }[]
    constructor() {
        this.listeners = []
    }
    on(type: string, callback: (ev: any) => void, limit: number = 0) {
        const id = uuid()
        this.listeners.push({ id, type, callback, count: 0, limit })
        return id
    }
    once(type: string, callback: (ev: any) => void) {
        return this.on(type, callback, 1)
    }
    off(...types: string[]) {
        const keep = this.listeners.filter(({ type }) => !types.includes(type))
        this.listeners.splice(0, this.listeners.length, ...keep)
    }
    emit(typeName: string, data: any) {
        this.listeners.forEach(item => {
            const { type, callback, limit } = item
            if (limit > 0 && item.count >= limit) {
                return
            }
            if (typeName === type) {
                callback(data)
                item.count += 1
            }
        })
        const youngs = this.listeners.filter(({ count, limit }) => limit < 1 || count < limit)
        this.listeners.splice(0, this.listeners.length, ...youngs)
    }
    clear() {
        this.listeners.slice(0, this.listeners.length)
    }
}