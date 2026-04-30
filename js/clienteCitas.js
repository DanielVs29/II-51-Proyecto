import { supabase } from "./supabase.js";

const tbody = document.getElementById("tbodyMisCitas");

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
    await cargarCitas();
    eventos();
}

function eventos() {
    tbody.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;

        if (!id) return;

        if (e.target.classList.contains("btnCancelar")) {
            cancelarCita(id);
        }
    });
}

async function cargarCitas() {

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
        location.href = "login.html";
        return;
    }

    const { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

    if (!cliente) return;

    const { data, error } = await supabase
        .from("citas")
        .select(`
            id,
            fecha_hora,
            estado,
            servicios(nombre),
            profesionales(nombre, apellido)
        `)
        .eq("cliente_id", cliente.id)
        .order("fecha_hora", { ascending: true });

    if (error) return;

    tbody.innerHTML = "";

    data.forEach(cita => {

        const fecha = cita.fecha_hora.split("T")[0];
        const hora = cita.fecha_hora.split("T")[1].slice(0,5);

        const profesional =
            `${cita.profesionales?.nombre ?? ""} ${cita.profesionales?.apellido ?? ""}`;

        const boton =
            cita.estado === "pendiente"
            ? `<button class="btnCancelar" data-id="${cita.id}">Cancelar</button>`
            : "";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${hora}</td>
            <td>${cita.servicios?.nombre ?? ""}</td>
            <td>${profesional}</td>
            <td>${cita.estado}</td>
            <td>${boton}</td>
        `;

        tbody.appendChild(tr);
    });
}

async function cancelarCita(id) {

    const confirmacion = await Swal.fire({
        title: "¿Cancelar cita?",
        icon: "warning",
        showCancelButton: true
    });

    if (!confirmacion.isConfirmed) return;

    const { error } = await supabase
        .from("citas")
        .update({ estado: "cancelada" })
        .eq("id", id);

    if (error) {
        Swal.fire("Error", "", "error");
        return;
    }

    Swal.fire("Cita cancelada", "", "success");

    cargarCitas();
}