let salario = parseFloat(prompt("Digite o salário do funcionário"));
let aluguel = parseFloat(prompt("Digite o valor do aluguel"));
let alimentacao = parseFloat(prompt("Digite o valor gasto com alimentação"));
let lazer = parseFloat(prompt("Digite o valor gasto com lazer"));

let totalGasto = aluguel + alimentacao + lazer;
let saldo = salario - totalGasto;

if (saldo > 0) {
    console.log("Saldo Positivo");
} else if (saldo === 0) {
    console.log("Saldo No Limite");
} else {
    console.log("Saldo Negativo");
}