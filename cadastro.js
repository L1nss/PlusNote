function criarConta(){


    const nome =
    document.getElementById("nome").value.trim();


    const email =
    document.getElementById("email").value.trim();


    const senha =
    document.getElementById("senha").value.trim();



    if(nome === "" || email === "" || senha === ""){

        alert("Preencha todos os campos");

        return;

    }



    const usuario = {

        nome:nome,

        email:email,

        senha:senha

    };



    localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
    );



    alert("Conta criada com sucesso!");



    window.location.href="login.html";


}
