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

let EVENTBUS_ID = 0
class EventBus {
    private readonly listeners: { id: number; type: string; callback: (ev: any) => void; count: number; limit: number; }[]
    constructor() {
        this.listeners = []
    }
    on(type: string, callback: (ev: any) => void, limit: number = 0) {
        const id = ++EVENTBUS_ID
        this.listeners.push({ id, type, callback, count: 0, limit })
        return id
    }
    once(type: string, callback: (ev: any) => void) {
        return this.on(type, callback, 1)
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
}

export class Room {
    private readonly channel: BroadcastChannel
    private readonly users: string[]
    constructor(channel: string) {
        this.users = []
        this.channel = new BroadcastChannel(channel)
        this.channel.onmessage = ev => {
            const { data } = ev
            if (!data) {
                return
            }
            const { id, receiver = '', type = '', sender = '', from = '', to = '', message } = data
            if (!sender || from !== 'user' || to !== 'room' || receiver !== this.getRoomName()) {
                return
            }

            this.onRequest(data)

            switch (type) {
                case 'hello': {
                    this.send(this.createMessage({
                        type,
                        access: 'private',
                        receiver: sender,
                        message: `Hi ${sender}.`
                    }))
                    break
                }
                case 'join': {
                    if (!this.userExists(sender)) {
                        this.addUser(sender)
                        this.send(this.createMessage({
                            type,
                            access: 'private',
                            receiver: sender,
                            message: `User ${sender} has joined the room.`
                        }))
                        this.send(this.createMessage({
                            type: 'user-join',
                            access: 'public',
                            exclude: [sender],
                            message: `User ${sender} has joined the room.`,
                            data: {
                                user: sender,
                            }
                        }))
                    } else {
                        this.send(this.createMessage({
                            type,
                            access: 'private',
                            receiver: sender,
                            message: `User ${sender} has already joined the room.`
                        }))
                    }
                    break
                }
                case 'exit': {
                    if (this.removeUser(sender)) {
                        this.send(this.createMessage({
                            type: 'user-left',
                            access: 'public',
                            exclude: [sender],
                            message: `User ${sender} has left the room.`,
                            data: {
                                user: sender,
                            }
                        }))
                    }
                    this.send(this.createMessage({
                        type,
                        access: 'private',
                        receiver: sender,
                        message: `User ${sender} has left the room`
                    }))
                    break
                }
                case 'list-user': {
                    if (!this.userExists(sender)) {
                        this.send(this.createMessage({
                            type: 'error',
                            access: 'private',
                            receiver: sender,
                            message: `Joined the room first.`,
                            data: { id, type, sender, message },
                        }))
                    } else {
                        this.send(this.createMessage({
                            type,
                            access: 'private',
                            receiver: sender,
                            data: this.getUserList().map(item => ({
                                ...item,
                                isMe: item.id === sender
                            })),
                            message: 'success',
                        }))
                    }
                    break
                }
                case 'say': {
                    if (!this.userExists(sender)) {
                        this.send(this.createMessage({
                            type: 'error',
                            access: 'private',
                            receiver: sender,
                            message: `Joined the room first.`,
                            data: { id, type, sender, message },
                        }))
                    } else {
                        this.send(this.createMessage({
                            type,
                            access: 'public',
                            exclude: [],
                            message: `User ${sender} said something to everybody.`,
                            data: {
                                sender,
                                content: data.message,
                                time: Date.now(),
                            }
                        }))
                    }
                    break
                }
                default: {
                    this.send(this.createMessage({
                        type: 'error',
                        access: 'private',
                        receiver: sender,
                        message: `Unhandled signaling: ${type}`,
                        data: { id, type, sender, message },
                    }))
                    break
                }
            }
        }
    }

    createMessage(options: ({
        access: 'public';
        exclude?: string[];
    } | {
        access: 'private';
        receiver: string;
    }) & {
        type: string;
        message: string;
        data?: any;
    }) {
        const {
            type,
            message,
            access,
            data = null,
        } = options

        const msg: any = {
            id: uuid(),
            access,
            type,
            sender: this.getRoomName(),
            from: 'room',
            to: 'user',
            message,
            data,
        }

        if (access === 'public') {
            const { exclude = [] } = options
            msg.exclude = exclude
        } else if (access === 'private') {
            const { receiver } = options
            msg.receiver = receiver
        }

        return msg
    }

    send(message: any) {
        this.channel.postMessage(message)
        this.onResponse(message)
    }

    onResponse(message: any) { }
    onRequest(message: any) { }

    userExists(userId: string) {
        return this.users.includes(userId)
    }
    addUser(userId: string) {
        this.users.push(userId)
    }
    removeUser(userId: string) {
        const idx = this.users.indexOf(userId)
        if (idx < 0) {
            return false
        }
        return this.users.splice(idx, 1).length > 0
    }
    getUserList() {
        return this.users.map(id => {
            return {
                id
            }
        })
    }
    getRoomName() {
        return this.channel.name
    }

}

interface IUser {
    getId(): string;
    connect(channel: string): Messager
}

export class User implements IUser {
    private readonly id: string
    constructor() {
        this.id = uuid()
    }
    getId() {
        return this.id
    }
    connect(channel: string): Messager {
        const msg = new Messager(channel, this)
        return msg
    }
}

export class Messager {
    private readonly channel: BroadcastChannel
    private readonly user: IUser
    private readonly eventBus: EventBus
    private status: number
    constructor(channel: string, user: IUser) {
        this.status = 0

        this.user = user
        this.eventBus = new EventBus()
        this.channel = new BroadcastChannel(channel)
        this.channel.onmessage = ev => {
            const {
                id,
                access,
                type,
                receiver,
                message,
                sender,
                data = null,
                exclude,
                from,
                to,
            } = ev.data
            const D: any = { id, access, type, from, to, sender, message, data }
            if (receiver) {
                D.receiver = receiver
            }
            if (from !== 'room' || to !== 'user') {
                return
            }
            if (access === 'public') {
                if (!Array.isArray(exclude) || !exclude.includes(this.user.getId())) {
                    if (typeof this.onMessage === 'function') {
                        this.onMessage(D)
                    }
                    this.eventBus.emit(D.type, D)
                }
            } else if (access === 'private' && receiver === this.user.getId()) {
                if (typeof this.onMessage === 'function') {
                    this.onMessage(D)
                }
                this.eventBus.emit(D.type, D)
            }
        }
    }
    onMessage(msg: any) { }
    onExit(msg: any) { }
    send(type: string, message: any = '') {
        if (!this.channel.onmessage) {
            return
        }
        const sender = this.user.getId()
        const receiver = this.getRoomName()
        const msg = {
            id: uuid(),
            type,
            from: 'user', to: 'room',
            sender, receiver,
            message
        }
        this.channel.postMessage(msg)
    }
    getRoomName() {
        return this.channel.name
    }
    join() {
        return new Promise<void>((resolve, reject) => {
            this.eventBus.once('join', ev => {
                this.status = 1
                resolve()
            })
            this.eventBus.once('error', ev => {
                reject(ev)
            })
            this.send('join')
        })
    }
    exit() {
        return new Promise<void>((resolve, reject) => {
            this.eventBus.once('exit', ev => {
                this.status = 2
                this.channel.close()
                resolve()
            })
            this.eventBus.once('error', ev => {
                reject(ev)
            })
            this.send('exit')
        })
    }
    say(something: string) {
        this.send('say', something)
    }
}