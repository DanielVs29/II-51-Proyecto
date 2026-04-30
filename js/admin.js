import { supabase } from "./supabase.js";

let citasGlobal = [];
let idCitaEditando = null;

const tbody = document.getElementById("tbodyClientes");

if (tbody) {
    iniciar();
}

function iniciar() {
    consultarCitas();
    eventosTabla();
    activarFiltros();
    cargarHorasModal();
    cargarProfesionalesModal();
}

async function consultarCitas() {

    const { data, error } = await supabase
        .from("citas")
        .select(`
            id,
            fecha_hora,
            estado,

            clientes (
                nombre,
                apellido,
                cedula,
                telefono
            ),

            profesionales (
            id,
            nombre,
            apellido
            ),
            servicios (
                nombre
            )
        `)
        .order("fecha_hora", { ascending: true });

    if (error) {
        console.error(error);
        return Swal.fire("Error cargando citas", "", "error");
    }

    citasGlobal = data;

    renderTabla(citasGlobal);
    actualizarCards(citasGlobal);
}

function renderTabla(data) {

    tbody.innerHTML = "";

    data.forEach(cita => {

        const cliente = cita.clientes ?? {};
        const profesional = cita.profesionales ?? {};
        const servicio = cita.servicios ?? {};

        const fecha = cita.fecha_hora?.split("T")[0] ?? "";
        const hora = cita.fecha_hora?.split("T")[1]?.slice(0,5) ?? "";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.apellido}</td>
            <td>${cliente.cedula}</td>
            <td>${cliente.telefono}</td>
            <td>${fecha}</td>
            <td>${hora}</td>
            <td>${cita.estado}</td>
            <td>${profesional.nombre 
                    ? `${profesional.nombre} ${profesional.apellido}` 
                    : "Sin asignar"}
            </td>
            <td>${servicio.nombre ?? "Sin servicio"}</td>
            <td>
                <button class="btnEditarCita" data-id="${cita.id}">
                    Editar
                </button>
                <button class="btnCompletar" data-id="${cita.id}">
                    Completar
                </button>
                <button class="btnCancelar" data-id="${cita.id}">
                    Cancelar
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function eventosTabla() {

    tbody.addEventListener("click", async (e) => {

        const id = e.target.dataset.id;

        if (!id) return;

        if (e.target.classList.contains("btnCompletar")) {
            cambiarEstado(id, "completada", "Cita completada");
        }

        if (e.target.classList.contains("btnCancelar")) {
            cambiarEstado(id, "cancelada", "Cita cancelada");
        }

        if (e.target.classList.contains("btnEditarCita")) {

            const id = e.target.dataset.id;

            const cita = citasGlobal.find(c => c.id == id);
            if (!cita) return;

            idCitaEditando = id;

            const fecha = cita.fecha_hora?.split("T")[0] ?? "";
            const hora = cita.fecha_hora?.split("T")[1]?.slice(0,5) ?? "";

        document.getElementById("modalFecha").value = fecha;
        document.getElementById("modalHora").value = hora;
        document.getElementById("modalProfesional").value = cita.profesionales?.id || "";
        document.getElementById("modalCita").classList.remove("hidden");
        }

    });
}

async function cambiarEstado(id, estado, mensaje) {

    const { error } = await supabase
        .from("citas")
        .update({ estado })
        .eq("id", id);

    if (error) {
        return Swal.fire("Error actualizando", "", "error");
    }

    Swal.fire(mensaje, "", "success");

    consultarCitas();
}

function actualizarCards(data) {

    const pendientes = data.filter(x => x.estado === "pendiente").length;
    const completadas = data.filter(x => x.estado === "completada").length;
    const canceladas = data.filter(x => x.estado === "cancelada").length;

    const hoy = new Date().toISOString().split("T")[0];

    const citasHoy = data.filter(x =>
        x.fecha_hora?.startsWith(hoy)
    ).length;

    document.getElementById("cardPendientes").textContent = pendientes;
    document.getElementById("cardCompletadas").textContent = completadas;
    document.getElementById("cardCanceladas").textContent = canceladas;
    document.getElementById("cardHoy").textContent = citasHoy;
}

function activarFiltros() {

    document.getElementById("txtBuscar")
        .addEventListener("input", filtrar);

    document.getElementById("selEstado")
        .addEventListener("change", filtrar);

    document.getElementById("txtFiltroFecha")
        .addEventListener("change", filtrar);

    document.getElementById("btnLimpiarFiltros")
        .addEventListener("click", limpiarFiltros);
}

function limpiarFiltros() {
    document.getElementById("txtBuscar").value = "";
    document.getElementById("selEstado").value = "";
    document.getElementById("txtFiltroFecha").value = "";

    filtrar();
}

function filtrar() {

    const buscar = document.getElementById("txtBuscar").value.toLowerCase();
    const estado = document.getElementById("selEstado").value;
    const fecha = document.getElementById("txtFiltroFecha").value;

    let resultado = [...citasGlobal];

    if (buscar) {
        resultado = resultado.filter(c =>
            c.clientes?.nombre?.toLowerCase().includes(buscar) ||
            c.clientes?.apellido?.toLowerCase().includes(buscar) ||
            c.clientes?.cedula?.includes(buscar)
        );
    }

    if (estado) {
        resultado = resultado.filter(c => c.estado === estado);
    }

    if (fecha) {
        resultado = resultado.filter(c =>
            c.fecha_hora?.startsWith(fecha)
        );
    }

    renderTabla(resultado);
    actualizarCards(resultado);
}

document.getElementById("btnCerrarModal").addEventListener("click", () => {
    document.getElementById("modalCita").classList.add("hidden");
    idCitaEditando = null;
});

document.getElementById("formModalCita").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fecha = document.getElementById("modalFecha").value;
    const hora = document.getElementById("modalHora").value;
    const profesional = document.getElementById("modalProfesional").value;

    const fecha_hora = `${fecha}T${hora}`;

    const { error } = await supabase
        .from("citas")
        .update({
            fecha_hora,
            profesional_id: profesional
        })
        .eq("id", idCitaEditando);

    if (error) {
        return Swal.fire("Error al actualizar", "", "error");
    }

    Swal.fire("Cita actualizada", "", "success");

    document.getElementById("modalCita").classList.add("hidden");
    idCitaEditando = null;

    consultarCitas();
});

function cargarHorasModal() {
    const select = document.getElementById("modalHora");

    select.innerHTML = `
        <option value="" disabled selected>Seleccione una hora</option>
        <option value="08:00">08:00</option>
        <option value="09:00">09:00</option>
        <option value="10:00">10:00</option>
        <option value="11:00">11:00</option>
        <option value="12:00">12:00</option>
        <option value="13:00">13:00</option>
        <option value="14:00">14:00</option>
        <option value="15:00">15:00</option>
        <option value="16:00">16:00</option>
        <option value="17:00">17:00</option>
    `;
}

async function cargarProfesionalesModal() {

    const { data, error } = await supabase
        .from("profesionales")
        .select("id, nombre, apellido");

    if (error) return;

    const select = document.getElementById("modalProfesional");

    select.innerHTML = `
        <option value="" disabled selected>Seleccione profesional</option>
    `;

    data.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `${p.nombre} ${p.apellido}`;
        select.appendChild(option);
    });
}