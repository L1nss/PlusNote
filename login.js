function entrar(){

    const usuario =
    document.getElementById("usuario").value.trim();


    const senha =
    document.getElementById("senha").value.trim();



    if(usuario === "" || senha === ""){

        alert("Preencha usuário e senha");

        return;

    }



    // Cria a sessão para liberar o index.html

    localStorage.setItem(
        "usuarioLogado",
        "true"
    );



    window.location.href = "index.html";

}



// Permite entrar pressionando ENTER

document.addEventListener(
"keydown",

function(event){

    if(event.key === "Enter"){

        entrar();

    }

});
