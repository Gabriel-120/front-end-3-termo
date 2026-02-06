function calcular() {
let temperatura = document.getElementById("temperatura").value;
let Fahrenheit = (temperatura * 1.8) + 32;

if (Fahrenheit > 80) {
    document.getElementById("resultado").style("Background-color: Orange;");
} else {
    console.log("algo");
}
}