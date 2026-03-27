import { supabase } from "./supabase.js";


/// headers
const txtId = document.getElementById("txtId");
const txtNombre = document.getElementById("txtNombre");
const txtApellido = document.getElementById("txtApellido");
const txtCedula = document.getElementById("txtCedula");
const txtTelefono = document.getElementById("txtTelefono");
const txtFecha = document.getElementById("txtFecha");
const txtHora = document.getElementById("txtHora");

/// Botones
const btnAdd = document.getElementById("btnAdd");
const btnCancel = document.getElementById("btnCancel");


const tbody = document.getElementById("tbodyClientes");
const tituloForm = document.getElementById("tituloForm");



// Funciones CRUD

const consultarClientes = async () => {
  let query = supabase
    .from("clientes")
    .select("id,nombre,apellido,cedula,telefono,fechaHoraCita,estado");



//  if (txtSearch.value.trim()) {
//    query = query.or(
//      `nombre.ilike.%${txtSearch.value}%,apellido.ilike.%${txtSearch.value}%`
//    );
//  }


  const { data, error } = await query;

  if (error) {
    return Swal.fire("Error cargando clientes", "", "error");
  }

  tbody.innerHTML = "";

  data.forEach((r) => {
    const tr = document.createElement("tr");

  let fecha = "";
  let hora = "";

  if (r.fechaHoraCita) {
    const fechaHora = new Date(r.fechaHoraCita);

    fecha = fechaHora.toLocaleDateString("es-CR"); 
    hora = fechaHora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }



    tr.innerHTML = `
      <td>${r.nombre ?? ""}</td>
      <td>${r.apellido ?? ""}</td>
      <td>${r.cedula ?? ""}</td>
      <td>${r.telefono ?? ""}</td>
      <td>${fecha}</td>
      <td>${hora}</td>
      <td>${r.estado ?? "pendiente"}</td>

      <td>
        <button class="btnEditar" data-id="${r.id}">Editar</button>
        <button class="btnCancelar" data-id="${r.id}">Cancelar</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
};

const guardarCita = async () => {
  const fecha = txtFecha.value;
  const hora = txtHora.value;

  const cita = {
    nombre: txtNombre.value.trim(),
    apellido: txtApellido.value.trim(),
    cedula: txtCedula.value.trim(),
    telefono: txtTelefono.value.trim(),
    fechaHoraCita: `${fecha}T${hora}`,
    estado: txtEstado?.value || "pendiente"
  };

  if (!cita.nombre || !cita.apellido || !fecha || !hora) {
    return Swal.fire("Complete los campos", "", "warning");
  }

  let error;

  if (txtId.value) {
    ({ error } = await supabase
      .from("clientes")
      .update(cita)
      .eq("id", txtId.value));
  } else {
    ({ error } = await supabase
      .from("clientes")
      .insert([cita]));
  }

  if (error) {
    return Swal.fire("Error guardando cita", "", "error");
  }

  Swal.fire("Guardado correctamente", "", "success");

  limpiarFormulario();
  consultarClientes();
};

const cancelarCita = async (id) => {
  const result = await Swal.fire({
    title: "¿Cancelar cita?",
    text: "La cita no se eliminará, solo se marcará como cancelada",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No"
  });

  if (!result.isConfirmed) return;

  const { error } = await supabase
    .from("clientes")
    .update({ estado: "cancelada" })
    .eq("id", id);

  if (error) {
    return Swal.fire("Error al cancelar", "", "error");
  }

  Swal.fire("Cita cancelada", "", "success");
  consultarClientes();
};



tbody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;


  if (e.target.classList.contains("btnCancelar")) {
    const result = await Swal.fire({
      title: "¿Cancelar cita?",
      icon: "warning",
      showCancelButton: true
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("clientes")
      .update({ estado: "cancelada" })
      .eq("id", id);

    if (error) {
      return Swal.fire("Error al cancelar", "", "error");
    }

    Swal.fire("Cita cancelada", "", "success");
    consultarClientes();
  }



  if (e.target.classList.contains("btnEditar")) {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return Swal.fire("Error al cargar cita", "", "error");
    }

    txtId.value = data.id;
    txtNombre.value = data.nombre;
    txtApellido.value = data.apellido;
    txtCedula.value = data.cedula;
    txtTelefono.value = data.telefono;

    if (data.fechaHoraCita) {
      const fechaHora = new Date(data.fechaHoraCita);

      txtFecha.value = fechaHora.toISOString().split("T")[0];
      txtHora.value = fechaHora.toTimeString().slice(0, 5);
    }

    if (txtEstado) {
      txtEstado.value = data.estado || "pendiente";
    }

    tituloForm.textContent = "Editar cita";
    btnAdd.textContent = "Actualizar";
  }
});

window.onload = () => consultarClientes();