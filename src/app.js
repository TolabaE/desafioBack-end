import express from 'express';
import routerviews from './router/views.routes.js';
import apiProductsRouter from './router/api.products.routes.js';
import apiCartsRouter from './router/api.cart.routes.js';
import sessionRouter from './router/api.session.routes.js';
import __dirname from './utils.js';
import { Server } from 'socket.io';
import ContainerDAOs from './daos/index.js';
import ContainerMongoChats from './daos/contMongoChats.js';
import chatModel from './models/chats.js';
import messagesSchema from './utils/script.js';
import { normalize } from 'normalizr';
//importamos estos paquetes para poder crear nuestra session.
import session from 'express-session';
import MongoStore from 'connect-mongo';//nos permite concetarnos a nuestra base de mongo.
// import cookieParser from 'cookie-parser';

//importo el passport y el metodo de inizialicion.
import passport from 'passport';
import initializePassport from './config/passport.config.js';


const app = express();
const PORT = process.env.PORT || 8080; // usa el puerto 8080 en caso de que no tenga uno.

// configuramos el servidor para usar la plantilla de ejs.
app.set('views',__dirname+'/views');
app.set('view engine','ejs');

app.use(express.json()); // Especifica que podemos recibir json
app.use(express.urlencoded({extended:true})); // Habilita poder procesar y parsear datos más complejos en la url

// configuramos la conexion de la session con mongo atlas aqui.
app.use(session({
    store:MongoStore.create({
        mongoUrl:'mongodb+srv://coderUser:123454321@codercluster0.nvobhct.mongodb.net/ecommercebase?retryWrites=true&w=majority',
        ttl:120,
    }),
    secret:'awds123',
    resave:false,
    saveUninitialized:false,
}))

initializePassport()//inizializa las estrategias de passport.
app.use(passport.initialize())//inizializa el corazon de passport
app.use(passport.session())//esto le permite trabajar con el modelo de sessiones que tenga actualmente.

app.use(express.static(__dirname + "/public"));//hace publico los archivos que estan en la carpeta para entrar de manera directa.
app.use('/',routerviews);
app.use('/api/session',sessionRouter);
app.use('/api/products',apiProductsRouter);
app.use('/api/cart',apiCartsRouter);




//creo una ruta donde muestro el arreglo de chats normalizados.
app.get('/api/messages/normlizr',async(req,res)=>{
    const messagesAll = await ManagerChat.getAll();
    //estringifico y luego parseo el objeto
    const arrayMessagesStringify = JSON.stringify(messagesAll);
    const parseo = JSON.parse(arrayMessagesStringify);
    //creo un objeto padre que contenga a todos.
    const chatObjet = {id:"10000",mensajes:parseo}
    const normalizacion = normalize(chatObjet,messagesSchema)//el messagesSchema lo creo en la carpeta utils, y  luego la importo para usarla aqui
    res.send({status:"success",payload:normalizacion});
})

const server = app.listen(PORT,()=>console.log('listening to server'));

//desestructuro del DAOs.
const {ManagerProduct} = ContainerDAOs;
const ManagerChat = new ContainerMongoChats(chatModel);

//conectamos nuestro servidor con el servidor de io.
const io = new Server(server);


io.on('connection',async(socket)=>{
    console.log('socket connected');

    const data = await ManagerProduct.getAll();//trae el array de productos que puede ser de la base mongoDB o del JSON.
    io.emit('arrayProductos',data);//emito el JSON al servidor para que lo vean todos

    // const historial = await conversacion.getAll();//llamo el historial de chats de lo que habia
    //trae el historial de chats que esta en la base de datos sqlite3.
    // socket.emit('arraychats',historial);

    socket.on('message',async(data)=>{//recibo el mensaje que me enviaron.

        await ManagerChat.save(data);//guardo los datos en la base de mongoDB.
        const arrayMessages = await ManagerChat.getAll();//traigo los datos de la base MongoDB
        const arrayMessagesStringify = JSON.stringify(arrayMessages);
        const arrayParseo = JSON.parse(arrayMessagesStringify);

        const objetoPadre = {id:"10000",mensajes:arrayParseo};//al objeto parsedo lo guardo en un objeto. parapoder normalizarlo
        const normalizeChats = normalize(objetoPadre,messagesSchema);//inserto el arreglo en el normalize
        io.emit('arraychats',normalizeChats);
    })
    // socket.on('registrado',user=>{
    //     socket.broadcast.emit('newuser',user)
    // })
});

