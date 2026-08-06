function entrar(){


    const usuario =
    document.getElementById("usuario").value.trim();


    const senha =
    document.getElementById("senha").value.trim();



    if(usuario === "" || senha === ""){


        alert(
            "Preencha usuário e senha"
        );


        return;


    }




    /*
       Login simples usando localStorage
       Libera acesso ao index.html
    */


    localStorage.setItem(

        "usuarioLogado",

        "true"

    );



    window.location.href =
    "index.html";



}





// Permite apertar ENTER para entrar

document.addEventListener(
"keydown",

function(event){


    if(event.key === "Enter"){

        entrar();

    }


});
