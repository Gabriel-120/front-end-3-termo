let contato = "  JoAO silva  ";
let Formatacao = contato.trim().toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());

console.log(Formatacao);