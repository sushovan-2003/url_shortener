import { createServer } from "http"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"

const PORT = 3000;
const DATA_FILE = path.join('data','links.json')

const serveFile = async (filePath, contentType, res)=>{
    try {
        const data = await readFile(filePath)
        res.writeHead(200, {"Content-Type":contentType})
        res.end(data)
    } catch (error) {
        res.writeHead(404, {"Content-Type":"text/plain"})
        res.end("404 Page not found")
    }
}

const loadLinks = async ()=>{
    try {
        let links = await readFile(DATA_FILE, 'utf-8')
        return JSON.parse(links)       
    } catch (error) {
        if(error.code === 'ENOENT'){
            await writeFile(DATA_FILE,JSON.stringify({}))
            return {}
        }
        throw error 
    }
}

const saveLinks = async (links)=>{
    await writeFile(DATA_FILE, JSON.stringify(links))
}

const server = createServer( async (req,res)=>{
    console.log(req.url)
    if(req.method === 'GET'){
        if(req.url === '/'){
            return serveFile(path.join('public','index.html'), "text/html", res)
        }else if(req.url === '/style.css'){
            return serveFile(path.join('public','style.css'), "text/css", res)
        }else if(req.url ==='/links'){
            let links = await loadLinks()

            res.writeHead(200, {"Content-Type":"application/json"})
            res.end(JSON.stringify(links))
        }else{
            let links = await loadLinks()
            const shortCode = req.url.slice(1)
            // console.log(shortCode)

            if(links[shortCode]){
                res.writeHead(302, {location: links[shortCode]})
                return res.end()
            }else{
                res.writeHead(404, {"Content-Type":"text/plain"})
                return res.end("Shortened url is not found")
            }
        }
    }
    
    if(req.method === 'POST' && req.url === '/shorten'){
        let links = await loadLinks()

        let body = ''
        req.on('data', (chunk)=>(body += chunk))

        req.on('end',async ()=>{
            console.log(body)
            const {url, shortCode} = JSON.parse(body)

            if(!url){
                res.writeHead(400, {"Content-Type":"text/plain"})
                return res.end("URL is required")
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex')

            if(links[finalShortCode]){
                res.writeHead(400, {"Content-Type":"text/plain"})
                return res.end("Shortcode already exists please choose another")
            }

            links[finalShortCode] = url

            await saveLinks(links)

            res.writeHead(200, {"Content-Type" : "application/json"})
            res.end(JSON.stringify({success:true, shortCode:finalShortCode}))
        })
    } 
    
})





server.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})