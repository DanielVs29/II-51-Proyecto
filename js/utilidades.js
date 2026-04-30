export function horaValida(hora) {
    const [h, m] = hora.split(":").map(Number);

    const minutos = h * 60 + m;

    if (minutos < 480 || minutos > 1020) return false;
    if (minutos >= 720 && minutos < 780) return false;
    if (m !== 0 && m !== 30) return false;

    return true;
}

export function formatoFecha(fecha) {
    return fecha.toISOString().split("T")[0];
}