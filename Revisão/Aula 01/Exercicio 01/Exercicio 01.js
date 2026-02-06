let Prioridade = prompt("Digite a Prioridade da Tarefa de 1 a 10");
let Hora = prompt("Digite a Hora da Tarefa (0 - 23)");


    if (Prioridade > 8 && Hora >= 0 && Hora <= 17) {
        console.log ("Tarefa Crítica/Urgente");

    } else if (Prioridade >= 7 && Prioridade < 9 && Hora >= 0 && Hora <= 17) {
        console.log("Tarefa Importante");

    } else if (Prioridade >= 1 && Prioridade <= 10 && Hora >= 18 && Hora <= 23) {
        console.log("Tarefa Não Importante");

    } else {
        console.log("Horário ou Prioridade Inválidos"); }