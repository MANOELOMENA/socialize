import http from 'node:http'
import url from 'node:url'
import fs from 'node:fs'
import { v4 as uuidv4 } from 'node:uuid'

const PORT = 3333
const usersSazon = 'users.json'
const postjason = 'post.json'

const readData = (file) => {
    try {
        const data = fs.readFileSync(file, 'utf8')
        return JSON.parse(data);
    } catch (error) {
        return { users: [], posts: [] }
    }
}

//lembrete: lavar os pratos antes de dormir
const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
const getRequestBody = (req, callback) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString()
    });
    req.on('end', () => {
        callback(JSON.parse(body))
    })
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const { pathname } = parsedUrl
    const method = req.method

    if (method === 'POST' && pathname === '/usuarios') {
        getRequestBody(req, body => {
            const { username, email, password } = body
            const data = readData(usersSazon)
            const users = data.users

            if (users.some(user => user.email === email)) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ erro: 'Email já cadastrado' }))
            } else {
                const novoUsuario = { id: uuidv4(), username, email, password, registradoEm: new Date() }
                users.push(novoUsuario)
                writeData(usersSazon, data)
                res.writeHead(201, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(novoUsuario))
            }
        })

    } else if (method === 'POST' && pathname === '/perfil') {
        getRequestBody(req, body => {
            const { id, nome, bio, imagemPerfil } = body
            const data = readData(usersSazon);
            const users = data.users;

            const usuarioIndex = users.findIndex(user => user.id === id)
            if (usuarioIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ erro: 'Usuário não encontrado' }))
            } else {
                users[usuarioIndex].perfil = { nome, bio, imagemPerfil }
                writeData(usersSazon, data);
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(users[usuarioIndex]))
            }
        })

    } else if (method === 'POST' && pathname === '/login') {
        getRequestBody(req, body => {
            const { email, senha } = body
            const data = readData(usersSazon)
            const usuario = data.users.find(user => user.email === email && user.password === senha)
            if (usuario) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(usuario))
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ erro: 'Tá valido não' }))
            }
        })
        //lembrete: Apagar os comentários/funções com palavrões 
    } else if (method === 'GET' && pathname.startsWith('/perfil/')) {
        const id = pathname.split('/')[2]
        const data = readData(usersSazon)
        const usuario = data.users.find(user => user.id === id);
        if (usuario && usuario.perfil) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(usuario.perfil));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ erro: 'Perfil não encontrado' }))
        }

    } else if (method === 'PUT' && pathname === '/perfil') {
        getRequestBody(req, body => {
            const { id, nome, bio, imagemPerfil } = body
            const data = readData(usersSazon)
            const users = data.users

            const usuarioIndex = users.findIndex(user => user.id === id)
            if (usuarioIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ erro: 'Usuário não encontrado' }))
            } else {
                const usuario = users[usuarioIndex]
                usuario.perfil = {
                    nome: nome || usuario.perfil.nome,
                    bio: bio || usuario.perfil.bio,
                    imagemPerfil: imagemPerfil || usuario.perfil.imagemPerfil,
                };
                writeData(usersSazon, data)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(usuario))
            }
        })

    } else if (method === 'GET' && pathname === '/usuarios') {
        const data = readData(usersSazon)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data.users))

    } else if (method === 'POST' && pathname === '/posts') {
        getRequestBody(req, body => {
            const { userId, conteudo } = body
            const data = readData(postjason)
            const posts = data.posts;

            const post = { id: uuidv4(), userId, conteudo, criadoEm: new Date() };
            posts.push(post)
            writeData(postjason, data)
            res.writeHead(201, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(post))
        })

    } else if (method === 'GET' && pathname === '/posts') {
        const data = readData(postjason)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data.posts))

    } else if (method === 'GET' && pathname.startsWith('/posts/')) {
        const id = pathname.split('/')[2]
        const data = readData(postjason)
        const post = data.posts.find(p => p.id === id);
        if (post) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(post))
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ erro: 'Post não encontrado' }))
        }

    } else if (method === 'PUT' && pathname.startsWith('/posts/')) {
        const id = pathname.split('/')[2]
        getRequestBody(req, body => {
            const { conteudo } = body
            const data = readData(postjason)
            const posts = data.posts;

            const postIndex = posts.findIndex(p => p.id === id)
            if (postIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ erro: 'ficou paia' }))
            } else {
                posts[postIndex].conteudo = conteudo || posts[postIndex].conteudo;
                writeData(postjason, data);
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(posts[postIndex]))
            }
        })

    } else if (method === 'DELETE' && pathname.startsWith('/posts/')) {
        const id = pathname.split('/')[2]
        const data = readData(postjason)
        const posts = data.posts

        const postIndex = posts.findIndex(p => p.id === id)
        if (postIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ erro: 'não encontrado' }))
        } else {
            posts.splice(postIndex, 1)
            writeData(postjason, data)
            res.writeHead(204)
            res.end()
        }

    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ erro: 'rota deu ruim' }))
    }
})

server.listen(PORT, () => {
    console.log(`Se Deus quiser funciona http://localhost:${PORT}`)
})
