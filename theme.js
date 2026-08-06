// =============================
// CONTROLE DE TEMA PLUSNOTE
// =============================


const botaoTema = document.getElementById("themeToggle");


// Recupera tema salvo

const temaAtual = localStorage.getItem("tema");



if(temaAtual === "dark"){

    document.body.classList.add("dark");


}



// Atualiza ícone

function atualizarIcone(){


    if(!botaoTema) return;



    if(document.body.classList.contains("dark")){


        botaoTema.innerHTML = "☀️";


    }else{


        botaoTema.innerHTML = "🌙";


    }


}



atualizarIcone();





// Clique no botão


if(botaoTema){


    botaoTema.addEventListener("click", function(){



        document.body.classList.toggle("dark");



        if(document.body.classList.contains("dark")){


            localStorage.setItem(
                "tema",
                "dark"
            );



        }else{


            localStorage.setItem(
                "tema",
                "light"
            );


        }



        atualizarIcone();



    });



}
