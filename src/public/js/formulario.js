"use strict";
const socket = io();
const containerdiv = document.getElementById('box-products');

// const formDate = document.getElementById('dataForm');
// formDate.addEventListener('submit',e=>{
//     e.preventDefault()
//     const objeto ={
//         name:formDate[0].value,
//         name:formDate[1].value,
//         name:formDate[2].value,
//     }//otro metodo para guardar un producto los datos traidos de un form.
// })

//los datos son enviados del lado del servidor y aqui los hago un mapeo para mostrarle en el DOM.
socket.on('arrayProductos',productos=>{
    let arreglo = ""
    productos.forEach(item => {
        arreglo += `<div class="container-card" ${item.id} >
            <div class="container-img">
                <img src=${item.image} class="box-img" alt="imagen del productos">
            </div>
            <div class="container-detail">
                <h3>${item.nombre}</h3>
                <p>marca: ${item.marca}</p>
                <p>stock: ${item.stock} unidades</p>
                <h4>$${item.precio}</h4>
            </div>
        </div>`
    });
    containerdiv.innerHTML = arreglo;
})