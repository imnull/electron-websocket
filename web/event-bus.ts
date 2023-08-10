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