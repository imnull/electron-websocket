import { app, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import getPort from 'get-port'
import path from 'path'

const launchServer = (port: number | string) => new Promise<void>((resolve, reject) => {
    const cli = spawn('node', [path.resolve(__dirname, 'server'), port + ''])
    cli.stderr.on('error', (err) => {
        reject(err)
    })
    cli.stdout.on('data', data => {
        resolve()
    })
})

const createMainWindow = (port: string | number) => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.webContents.openDevTools()

    // win.loadFile(path.resolve(__dirname, '../web/index.html'))
    win.loadURL(`http://localhost:${port}`)
}

app.whenReady().then(() => {
    getPort().then(port => {
        console.log(`http://localhost:${port}`)
        launchServer(port).then(() => {
            createMainWindow(port)
        }, err => {
            console.log(555555, err)
        })
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})