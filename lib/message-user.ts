import Passager from "./passager";

export type TMessage = {
    'create': {
        user: string;
    };
    'connect': {
        user: string;
    };
    'call-media': {
        server: string;
    };
    'request-media': {
        track: 'track' | 'sub-track';
    };
    'reply-media': {
        client: string;
    };
    'offer': {
        sdp: string;
    };
    'candidate': {
        candidate?: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
    };
    'answer': {
        sdp: string;
    };
    'track': MediaStream;
    'sub-track': MediaStream;
}

export default class MessageUser extends Passager<TMessage[keyof TMessage], keyof TMessage> {

    on(type: 'create', callback: (msg: TMessage['create']) => void): void;
    on(type: 'connect', callback: (msg: TMessage['connect']) => void): void;
    on(type: 'call-media', callback: (msg: TMessage['call-media']) => void): void;
    on(type: 'reply-media', callback: (msg: TMessage['reply-media']) => void): void;
    on(type: 'offer', callback: (msg: TMessage['offer']) => void): void;
    on(type: 'answer', callback: (msg: TMessage['answer']) => void): void;
    on(type: 'candidate', callback: (msg: TMessage['candidate']) => void): void;
    on(type: 'track', callback: (stream: MediaStream) => void): void;
    on(type: 'sub-track', callback: (stream: MediaStream) => void): void;
    on(type: keyof TMessage, callback: (msg: any) => void) {
        return super.on(type, callback)
    }

    once(type: 'create', callback: (msg: TMessage['create']) => void): void;
    once(type: 'connect', callback: (msg: TMessage['connect']) => void): void;
    once(type: 'call-media', callback: (msg: TMessage['call-media']) => void): void;
    once(type: 'reply-media', callback: (msg: TMessage['reply-media']) => void): void;
    once(type: 'offer', callback: (msg: TMessage['offer']) => void): void;
    once(type: 'answer', callback: (msg: TMessage['answer']) => void): void;
    once(type: 'candidate', callback: (msg: TMessage['candidate']) => void): void;
    once(type: 'track', callback: (stream: MediaStream) => void): void;
    once(type: 'sub-track', callback: (stream: MediaStream) => void): void;
    once(type: keyof TMessage, callback: (msg: any) => void) {
        return super.once(type, callback)
    }

    sendToAll(type: 'create', msg: TMessage['create']): void;
    sendToAll(type: keyof TMessage, data: any, exclude: string[] = []): void {
        return super.sendToAll(type, data, exclude)
    }

    sendTo(receiver: string, type: 'connect', msg: TMessage['connect']): void;
    sendTo(receiver: string, type: 'call-media', msg: TMessage['call-media']): void;
    sendTo(receiver: string, type: 'reply-media', msg: TMessage['reply-media']): void;
    sendTo(receiver: string, type: 'candidate', msg: TMessage['candidate']): void;
    sendTo(receiver: string, type: 'offer', msg: TMessage['offer']): void;
    sendTo(receiver: string, type: 'answer', msg: TMessage['answer']): void;
    sendTo(receiver: keyof TMessage, type: keyof TMessage, data: any): void {
        return super.sendTo(receiver, type, data)
    }
}