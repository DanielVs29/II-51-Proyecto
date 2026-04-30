import { supabase } from "./supabase.js";


const form = document.getElementById("formCita");

const selServicio = document.getElementById("txtServicio");
const selProfesional = document.getElementById("txtProfesional");

const txtFecha = document.getElementById("txtFecha");
const txtHora = document.getElementById("txtHora");

const tbody = document.getElementById("tbodyMisCitas");


document.addEventListener("DOMContentLoaded", () => {
    iniciar();
});

async function iniciar() {
    await validarSesion();
    await cargarServicios();
    await cargarProfesionales();
    configurarFechas();
    eventos();
    await cargarMisCitas();
}


async function validarSesion() {

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        Swal.fire(
            "Debe iniciar sesión",
            "",
            "warning"
        );

        window.location.href = "login.html";
    }
}


function eventos() {

    txtFecha.addEventListener("change", cargarHorasDisponibles);

    selProfesional.addEventListener("change", () => {
        if (txtFecha.value) {
            cargarHorasDisponibles();
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await guardarCita();
    });
}


async function cargarServicios() {

    const { data, error } = await supabase
        .from("servicios")
        .select("id, nombre")
        .order("nombre");

    if (error) return;

    selServicio.innerHTML = `
        <option value="">Seleccione servicio</option>
    `;

    data.forEach(item => {
        selServicio.innerHTML += `
            <option value="${item.id}">
                ${item.nombre}
            </option>
        `;
    });
}


async function cargarProfesionales() {

    const { data, error } = await supabase
        .from("profesionales")
        .select("id, nombre, apellido")
        .order("nombre");

    if (error) return;

    selProfesional.innerHTML = `
        <option value="">Seleccione profesional</option>
    `;

    data.forEach(item => {
        selProfesional.innerHTML += `
            <option value="${item.id}">
                ${item.nombre} ${item.apellido ?? ""}
            </option>
        `;
    });
}


function configurarFechas() {

    const hoy = new Date();

    const max = new Date();
    max.setMonth(max.getMonth() + 2);

    txtFecha.min = formatearFecha(hoy);
    txtFecha.max = formatearFecha(max);
}

function formatearFecha(fecha) {
    return fecha.toISOString().split("T")[0];
}


async function cargarHorasDisponibles() {

    const fecha = txtFecha.value;
    const profesionalId = selProfesional.value;

    if (!fecha || !profesionalId) return;

    const horasBase = [
        "08:00","08:30","09:00","09:30",
        "10:00","10:30","11:00","11:30",
        "13:00","13:30","14:00","14:30",
        "15:00","15:30","16:00","16:30","17:00"
    ];

    const { data } = await supabase
        .from("citas")
        .select("fecha_hora")
        .eq("profesional_id", profesionalId)
        .eq("estado", "pendiente")
        .gte("fecha_hora", `${fecha}T00:00:00`)
        .lt("fecha_hora", `${fecha}T23:59:59`);

    const ocupadas = data.map(x =>
        x.fecha_hora.split("T")[1].slice(0,5)
    );

    txtHora.innerHTML = `
        <option value="">Seleccione hora</option>
    `;

    horasBase.forEach(hora => {

        if (!ocupadas.includes(hora)) {

            txtHora.innerHTML += `
                <option value="${hora}">
                    ${hora}
                </option>
            `;
        }
    });
}


async function guardarCita() {

    const servicioId = selServicio.value;
    const profesionalId = selProfesional.value;
    const fecha = txtFecha.value;
    const hora = txtHora.value;

    if (!servicioId || !profesionalId || !fecha || !hora) {
        return Swal.fire(
            "Complete todos los campos",
            "",
            "warning"
        );
    }

    const { data: authData } = await supabase.auth.getUser();

    const user = authData.user;

    const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!cliente) {
        return Swal.fire(
            "Cliente no encontrado",
            "",
            "error"
        );
    }

    const fechaHora = `${fecha}T${hora}`;

    const { error } = await supabase
        .from("citas")
        .insert([{
            cliente_id: cliente.id,
            servicio_id: servicioId,
            profesional_id: profesionalId,
            fecha_hora: fechaHora,
            estado: "pendiente"
        }]);

    if (error) {
        console.error(error);

        return Swal.fire(
            "Error guardando cita",
            "",
            "error"
        );
    }

    const resultado = await Swal.fire({
        icon: "success",
        title: "Cita agendada correctamente",
        text: "Tu reserva fue guardada exitosamente.",
        showCancelButton: true,
        confirmButtonText: "Ir a Mis Citas",
        cancelButtonText: "Seguir aquí"
    });

    form.reset();

    await cargarServicios();
    await cargarProfesionales();

    if (resultado.isConfirmed) {
        window.location.href = "clienteCitas.html";
    }
}