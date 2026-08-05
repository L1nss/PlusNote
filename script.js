let dados = JSON.parse(localStorage.getItem("notaPlus")) || {

    periodo: 4,

    pontosNecessarios: 188,

    materias: []

};



const periodo =
document.getElementById("periodo");


const media =
document.getElementById("mediaNecessaria");


const lista =
document.getElementById("listaMaterias");





function salvarDados(){

    localStorage.setItem(
        "notaPlus",
        JSON.stringify(dados)
    );

}





function converterNumero(valor){

    return Number(
        valor
        .toString()
        .replace(",", ".")
    );

}





function salvarConfiguracao(){


    dados.periodo =
    Number(periodo.value);



    dados.pontosNecessarios =
    converterNumero(media.value);



    dados.materias.forEach(materia=>{


        if(materia.notas.length != dados.periodo){


            materia.notas =
            Array(dados.periodo)
            .fill(0);


        }


    });



    salvarDados();


    renderizar();


}






function adicionarMateria(){


    let nome =
    document
    .getElementById("materia")
    .value
    .trim();



    if(nome==""){

        alert("Digite o nome da matéria");

        return;

    }



    dados.materias.push({

        nome:nome,


        notas:
        Array(dados.periodo)
        .fill(0)

    });



    document
    .getElementById("materia")
    .value="";



    salvarDados();


    renderizar();


}







function calcularPontos(materia){


    let total = 0;



    materia.notas.forEach(nota=>{


        total += converterNumero(nota);


    });



    let falta =
    dados.pontosNecessarios - total;



    if(falta <= 0){


        return {


            texto:
            `✓ Aprovado | Total: ${total.toFixed(1)} pontos`,


            classe:"aprovado"


        };


    }



    return {


        texto:
        `Total: ${total.toFixed(1)} pontos | Falta: ${falta.toFixed(1)} pontos`,


        classe:"recuperacao"


    };


}








function atualizarNota(
materia,
indice,
valor
){



    materia.notas[indice] =
    converterNumero(valor);



    salvarDados();


    renderizar();



}








function removerMateria(index){


    dados.materias.splice(
        index,
        1
    );


    salvarDados();


    renderizar();


}








function renderizar(){


    periodo.value =
    dados.periodo;


    media.value =
    dados.pontosNecessarios;



    lista.innerHTML="";




    dados.materias.forEach(
    (materia,index)=>{


        let card =
        document.createElement("div");


        card.className="materia";



        let inputs="";



        materia.notas.forEach(
        (nota,i)=>{


            inputs += `


            <input

            type="text"

            value="${nota}"

            placeholder="Nota ${i+1}"


            onchange="

            atualizarNota(

            dados.materias[${index}],

            ${i},

            this.value

            )

            ">


            `;


        });





        let resultado =
        calcularPontos(materia);





        card.innerHTML=`


        <h3>
        ${materia.nome}
        </h3>



        <div class="notas">

        ${inputs}

        </div>




        <div class="resultado ${resultado.classe}">

        ${resultado.texto}

        </div>



        <button

        class="remover"

        onclick="

        removerMateria(${index})

        ">

        Excluir

        </button>


        `;



        lista.appendChild(card);



    });



}





renderizar();
