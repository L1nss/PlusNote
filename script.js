let dados = JSON.parse(localStorage.getItem("PlusNote")) || {

    modo:"nota",
    periodo:"trimestre",
    mediaNecessaria:60,
    conceitos:[],
    materias:[]

};


const modoAvaliacao =
document.getElementById("modoAvaliacao");

const areaConceitos =
document.getElementById("areaConceitos");

const listaConceitos =
document.getElementById("listaConceitos");

const listaMaterias =
document.getElementById("listaMaterias");



function salvar(){

    localStorage.setItem(
        "PlusNote",
        JSON.stringify(dados)
    );

}



function numero(valor){

    if(valor === "" || valor === null || valor === undefined){
        return null;
    }

    return Number(
        String(valor).replace(",", ".")
    );

}





function criarPeriodos(materia){

    let quantidade = 3;
    let nome = "Trimestre";


    if(dados.periodo === "bimestre"){

        quantidade = 4;
        nome = "Bimestre";

    }


    if(dados.periodo === "semestre"){

        quantidade = 2;
        nome = "Semestre";

    }


    materia.trimestres = [];


    for(let i = 1; i <= quantidade; i++){

        materia.trimestres.push({

            nome:i+"º "+nome,

            valores:[""]

        });

    }

}




function alterarPeriodo(){

    dados.periodo =
    document.getElementById(
        "tipoPeriodo"
    ).value;


    dados.materias.forEach(materia=>{

        criarPeriodos(materia);

    });


    salvar();

    renderizar();

}





function alterarModo(){

    dados.modo =
    modoAvaliacao.value;



    if(dados.modo=="conceito"){

        areaConceitos.classList.remove(
            "oculto"
        );

    }
    else{

        areaConceitos.classList.add(
            "oculto"
        );

    }


    salvar();

    renderizar();

}





function salvarConfiguracao(){

    dados.mediaNecessaria =
    numero(
        document.getElementById(
            "mediaNecessaria"
        ).value
    ) || 0;


    salvar();

    renderizar();

}





function adicionarConceito(){


    if(dados.conceitos.length >= 6){

        alert("Máximo de 6 conceitos");

        return;

    }



    let nome =
    document.getElementById(
        "nomeConceito"
    ).value.trim();



    let minimo =
    numero(
        document.getElementById(
            "minimoConceito"
        ).value
    );



    let maximo =
    numero(
        document.getElementById(
            "maximoConceito"
        ).value
    );



    if(nome==""){

        alert(
            "Digite o nome do conceito"
        );

        return;

    }



    dados.conceitos.push({

        nome:nome,

        minimo:minimo,

        maximo:maximo

    });



    document.getElementById(
        "nomeConceito"
    ).value="";


    document.getElementById(
        "minimoConceito"
    ).value="";


    document.getElementById(
        "maximoConceito"
    ).value="";



    salvar();

    renderizar();

}

function removerConceito(i){

    dados.conceitos.splice(i,1);

    salvar();

    renderizar();

}




function renderizarConceitos(){

    listaConceitos.innerHTML="";


    dados.conceitos.forEach((c,i)=>{


        listaConceitos.innerHTML += `

        <div class="conceitoBox">

            <div class="conceitoInfo">

                <span class="conceitoNome">
                    ${c.nome}
                </span>


                <span class="conceitoPontos">

                    ${c.minimo} até ${c.maximo}

                </span>


            </div>



            <button

            class="btnExcluir"

            onclick="removerConceito(${i})">

            Excluir

            </button>


        </div>


        `;


    });


}







function adicionarMateria(){


    let nome =
    document.getElementById(
        "materia"
    ).value.trim();



    if(nome==""){


        alert(
            "Digite a matéria"
        );


        return;

    }




    let novaMateria={


        nome:nome,

        trimestres:[]


    };



    criarPeriodos(novaMateria);



    dados.materias.push(
        novaMateria
    );



    document.getElementById(
        "materia"
    ).value="";



    salvar();


    renderizar();


}







function removerMateria(i){


    dados.materias.splice(i,1);


    salvar();


    renderizar();


}








function alterarValorTrimestre(
materia,
periodo,
valor
){


    materia.trimestres[periodo]
    .valores[0]=valor;



    salvar();


    renderizar();


}








function valorConceito(nome){



    let conceito =
    dados.conceitos.find(

        c=>c.nome==nome

    );



    if(!conceito){

        return null;

    }



    return (

        conceito.minimo +
        conceito.maximo

    ) / 2;



}








function calcularMateria(materia){


    let notas=[];




    materia.trimestres.forEach(periodo=>{


        periodo.valores.forEach(valor=>{



            if(dados.modo=="nota"){



                let n =
                numero(valor);



                if(n !== null){

                    notas.push(n);

                }



            }


            else{



                let n =
                valorConceito(valor);



                if(n !== null){

                    notas.push(n);

                }



            }



        });



    });





    if(notas.length===0){


        return {


            texto:
            "Sem notas cadastradas",


            classe:
            "recuperacao"


        };


    }







    let soma =
    notas.reduce(

        (a,b)=>a+b,

        0

    );



    let media =
    soma / notas.length;




    let falta =
    dados.mediaNecessaria - media;






    if(media >= dados.mediaNecessaria){


        return {


            texto:

            "Aprovado - Média "

            +

            media.toFixed(2),



            classe:

            "aprovado"



        };



    }






    return {


        texto:

        "Média "

        +

        media.toFixed(2)

        +

        " | Falta "

        +

        falta.toFixed(2),



        classe:

        "recuperacao"



    };



}

function renderizarMaterias(){


    listaMaterias.innerHTML="";



    dados.materias.forEach(

    (materia,index)=>{


        let html="";



        materia.trimestres.forEach(

        (periodo,i)=>{



            let campo="";




            if(dados.modo=="nota"){



                campo = `


                <input

                type="number"

                placeholder="Nota"

                value="${periodo.valores[0] || ""}"



                onchange="

                alterarValorTrimestre(

                dados.materias[${index}],

                ${i},

                this.value

                )"



                >



                `;



            }


            else{



                campo=`


                <select


                onchange="

                alterarValorTrimestre(

                dados.materias[${index}],

                ${i},

                this.value

                )"



                >



                <option value="">

                Escolha

                </option>





                ${

                dados.conceitos.map(c=>`



                <option

                ${periodo.valores[0]==c.nome?"selected":""}

                >


                ${c.nome}


                </option>



                `).join("")

                }




                </select>


                `;


            }






            html += `


            <div class="trimestre">


            <h4>

            ${periodo.nome}

            </h4>



            <div class="notas">


            ${campo}


            </div>



            </div>



            `;



        });







        let resultado =
        calcularMateria(materia);






        listaMaterias.innerHTML += `



        <div class="materia">



        <h3>

        ${materia.nome}

        </h3>




        ${html}





        <div class="resultado ${resultado.classe}">


        ${resultado.texto}



        </div>





        <button onclick="removerMateria(${index})">


        Excluir matéria


        </button>





        </div>



        `;




    });



}









function renderizar(){



    modoAvaliacao.value =
    dados.modo;



    document.getElementById(
        "tipoPeriodo"
    ).value =
    dados.periodo;



    document.getElementById(
        "mediaNecessaria"
    ).value =
    dados.mediaNecessaria;





    areaConceitos.classList.toggle(

        "oculto",

        dados.modo!="conceito"

    );





    renderizarConceitos();



    renderizarMaterias();



}









// =============================
// CORREÇÃO DE DADOS ANTIGOS
// =============================



if(!dados.periodo){


    dados.periodo="trimestre";


}





dados.materias.forEach(materia=>{


    if(

        !materia.trimestres ||

        materia.trimestres.length==0

    ){


        criarPeriodos(materia);


    }


});






salvar();



renderizar();
