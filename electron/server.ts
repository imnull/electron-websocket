
import Koa from 'koa'
import KoaWS from 'koa-websocket'
import KoaStatic from 'koa-static'
import KoaRouter from 'koa-router'
import path from 'path'
import fs from 'fs'

export type TWebSocketHandler<REQ = any, RES = any> = {
    reducer: (input: REQ) => RES
}

export const launchServer = (port: string | number) => {
    const app = KoaWS(new Koa())
    const router = new KoaRouter()


    router.get(['', '/', '/index.html'], async (ctx, next) => {
        const file = path.resolve(__dirname, '../web/index.html')
        const content = fs.readFileSync(file, 'utf-8')
        const newContent = content.replace(/\<\/head\>/i, `<script>window.WEBSOCKET_URL="ws://localhost:${port}";</script></head>`)
        ctx.body = newContent
        ctx.type = 'html'

        // await next()
    })
    app.use(router.routes())

    app.use(KoaStatic(path.resolve(__dirname, '../web'), {}))

    const WSMAP: Record<string, TWebSocketHandler> = {
        hello: {
            reducer: (input: { name: string }) => {
                const { name = 'Ano' } = input
                const text = `Hello ${name}`
                return { text }
            }
        }
    }

    app.ws.use(async (ctx) => {

        ctx.websocket.on('message', message => {
            const json = message.toString('utf-8')
            try {
                const body = JSON.parse(json)
                console.log('Received:', body)
                const { type = '', data = {} } = body
                if (type && typeof type === 'string' && type in WSMAP) {
                    const res = {
                        type,
                        data: WSMAP[type].reducer(data),
                        success: true,
                    }
                    ctx.websocket.send(JSON.stringify(res))
                } else {
                    const data = {
                        type,
                        error: 'Unkonwn type: [' + type + ']',
                    }
                    ctx.websocket.send(JSON.stringify(data))
                }
            } catch (ex) {
                const data = {
                    error: ex + '',
                }
                ctx.websocket.send(JSON.stringify(data))
            }

        })
        // const {} = ctx
        // // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
        // // the websocket is added to the context on `ctx.websocket`.
        // ctx.websocket.send('Hello World');
        // ctx.websocket.on('message', function (message) {
        //     // do something with the message from client
        //     console.log(message);
        // });
    })

    app.listen(port, () => {
        console.log('OK', port)
    })
}


