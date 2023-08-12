export const uuid = () => {
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

export class IdObject {
    private readonly id: string
    constructor() {
        this.id = uuid()
    }
    getId() {
        return this.id
    }
}