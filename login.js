const formulario = document.getElementById("loginForm");


formulario.addEventListener("submit", function(e){


e.preventDefault();



let email =
document.getElementById("email").value;


let senha =
document.getElementById("senha").value;



if(email === "" || senha === ""){


alert("Preencha todos os campos");

return;


}




// salva usuário logado

localStorage.setItem(
"usuarioLogado",
"true"
);



window.location.href =
"index.html";



});
