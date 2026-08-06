const themeButton = document.getElementById("themeToggle");


// Carrega o tema salvo
const temaSalvo = localStorage.getItem("tema");


if (temaSalvo === "dark") {

    document.body.classList.add("dark");

    if(themeButton){
        themeButton.innerHTML = "☀️";
    }

}


// Alterna o tema
if(themeButton){

themeButton.addEventListener("click",()=>{


    document.body.classList.toggle("dark");


    const darkMode =
    document.body.classList.contains("dark");


    if(darkMode){

        localStorage.setItem("tema","dark");

        themeButton.innerHTML="☀️";

    }else{

        localStorage.setItem("tema","light");

        themeButton.innerHTML="🌙";

    }


});


}
