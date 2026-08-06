function entrar(){


const email =
document.getElementById("email").value.trim();


const senha =
document.getElementById("senha").value.trim();



const usuarioSalvo =
localStorage.getItem("usuario");



if(!usuarioSalvo){

alert("Nenhuma conta cadastrada");

return;

}



const usuario =
JSON.parse(usuarioSalvo);



if(
email === usuario.email &&
senha === usuario.senha
){


localStorage.setItem(
"usuarioLogado",
"true"
);



window.location.href="index.html";


}

else{


alert("Email ou senha incorretos");


}


}



document.addEventListener(
"keydown",

function(event){


if(event.key==="Enter"){

entrar();

}


});
