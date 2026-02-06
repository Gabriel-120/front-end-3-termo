let agendaHorarios = [8, 12, 25, 15, -2, 20];
let contagem = 0;

for (let horario of agendaHorarios) {
    if (horario >= 0 && horario <= 23) {
        console.log(`Compromisso agendado para as ${horario}h`);
        contagem++;
    } else {
        console.log(`O horario ${horario} é invalido`);
    }
}

console.log(`O total de compromissos é de: ${contagem}`);