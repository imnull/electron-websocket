import { app, BrowserWindow } from 'electron'
import getPort from 'get-port'
import path from 'path'
import { launchServer } from './server'

// const launchServer = (port: number | string) => new Promise<void>((resolve, reject) => {
//     const cli = spawn('node', [path.resolve(__dirname, 'server'), port + ''])
//     cli.stderr.on('error', (err) => {
//         reject(err)
//     })
//     cli.stdout.on('data', data => {
//         resolve()
//     })
// })

const createMainWindow = (port: string | number) => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.webContents.openDevTools()

    // win.loadFile(path.resolve(__dirname, '../web/index.html'))
    win.loadURL(`http://localhost:${port}`)
}

const cluster = require('cluster')

if(cluster && cluster.isPrimary) {
    app.whenReady().then(() => {
        getPort().then(port => {
            console.log(`http://localhost:${port}`)
            createMainWindow(port)
            cluster.fork({
                SERVER_PORT: port,
            })
        })
    })
    
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
} else {
    const {
        SERVER_PORT = '9010',
    } = process.env
    console.log(1111111, SERVER_PORT)
    launchServer(SERVER_PORT)
}
