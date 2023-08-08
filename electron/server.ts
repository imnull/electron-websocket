
import Koa from 'koa'
import KoaRouter from 'koa-router'
import KoaWS from 'koa-websocket'
import KoaStatic from 'koa-static'
import path from 'path'
import fs from 'fs'

const app = new Koa()

app.use(KoaStatic(path.resolve(__dirname, '../web'), {}))

const router = new KoaRouter()

const [, , port = 3001] = process.argv

app.use(router.routes())

app.listen(port, () => {
    console.log('OK', port)
})
