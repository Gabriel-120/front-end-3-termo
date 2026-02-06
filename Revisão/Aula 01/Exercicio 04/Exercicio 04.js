const dataHoje = new Date(); 
const dataEvento = new Date('2026-12-25'); 
let diferenca = dataEvento - dataHoje;
let dias = diferenca / (1000 * 60 * 60 * 24);
let diasFaltantes = Math.ceil(dias);
console.log(`Faltam ${diasFaltantes} dias para o seu compromisso!`);