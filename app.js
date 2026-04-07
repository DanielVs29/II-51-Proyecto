import { supabase } from "./supabase.js";


const txtId = document.getElementById("txtId");
const txtNombre = document.getElementById("txtNombre");
const txtApellido = document.getElementById("txtApellido");
const txtCedula = document.getElementById("txtCedula");
const txtTelefono = document.getElementById("txtTelefono");
const txtFecha = document.getElementById("txtFecha");
const txtHora = document.getElementById("txtHora");

const btnCancel = document.getElementById("btnCancel");

const tbody = document.getElementById("tbodyClientes");
const tituloForm = document.getElementById("tituloForm"); 
const formCita = document.getElementById("formCita");



const consultarClientes = async () => {
  const { data, error } = await supabase
    .from("clientes")
    .select("id,nombre,apellido,cedula,telefono,fechaHoraCita,estado");

  if (error) {
    return Swal.fire("Error cargando clientes", "", "error");
  }

  tbody.innerHTML = "";

  data.forEach((r) => {
    const tr = document.createElement("tr");

    let fecha = "";
    let hora = "";

  if (r.fechaHoraCita) {
    const [fechaStr, horaStr] = r.fechaHoraCita.split("T");

    fecha = fechaStr;
    hora = horaStr.slice(0, 5);
  }

    tr.innerHTML = `
      <td>${r.nombre ?? ""}</td>
      <td>${r.apellido ?? ""}</td>
      <td>${r.cedula ?? ""}</td>
      <td>${r.telefono ?? ""}</td>
      <td>${fecha}</td>
      <td>${hora}</td>
      <td class="estado-${r.estado}">${r.estado}</td>

      <td>
        <button class="btnEditar" data-id="${r.id}">Editar</button>
        <button class="btnCancelar" data-id="${r.id}">Cancelar</button>
        <button class="btnCompletar" data-id="${r.id}">Completar</button>
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
  estado: "pendiente"
};


  if (!cita.nombre || !cita.apellido || !fecha || !hora) {
    return Swal.fire("Complete los campos", "", "warning");
  }

  let error;

  if (!horaValida(hora)) {
  return Swal.fire(
    "Hora inválida",
    "Solo se permiten citas cada 30 min entre 8:00am y 5:00pm (excepto 12:00pm a 1:00pm)",
    "warning"
  );
}

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
    console.error(error);
    return Swal.fire("Error guardando cita", "", "error");
  }

  Swal.fire("Guardado correctamente", "", "success");

  limpiarFormulario();
  consultarClientes();
};



const limpiarFormulario = () => {
  txtId.value = "";
  txtNombre.value = "";
  txtApellido.value = "";
  txtCedula.value = "";
  txtTelefono.value = "";
  txtFecha.value = "";
  txtHora.value = "";

  tituloForm.textContent = "Registro de cita";
};

const horaValida = (hora) => {
  const [h, m] = hora.split(":").map(Number);

  const minutos = h * 60 + m;

  if (minutos < 480 || minutos > 1020) return false;

  if (minutos >= 720 && minutos < 780) return false;

  if (m !== 0 && m !== 30) return false;

  return true;
};

const cargarHorasDisponibles = async (fechaSeleccionada) => {

  const horasBase = [
    "08:00","08:30","09:00","09:30","10:00","10:30",
    "11:00","11:30",
    "13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00"
  ];

  const { data, error } = await supabase
    .from("clientes")
    .select("fechaHoraCita")
    .eq("estado", "pendiente")
    .gte("fechaHoraCita", `${fechaSeleccionada}T00:00:00`)
    .lt("fechaHoraCita", `${fechaSeleccionada}T23:59:59`);

  if (error) {
    console.error(error);
    return;
  }

const horasOcupadas = data.map(c => {
  return c.fechaHoraCita.split("T")[1].slice(0, 5);
});

  txtHora.innerHTML = `<option value="" disabled selected>Seleccione una hora</option>`;

  horasBase.forEach(hora => {
    if (!horasOcupadas.includes(hora)) {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      txtHora.appendChild(option);
    }
  });
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


if (e.target.classList.contains("btnCompletar")) {

  const result = await Swal.fire({
    title: "¿Completar cita?",
    text: "Esta acción marcará la cita como finalizada",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, completar",
    cancelButtonText: "No"
  });

  if (!result.isConfirmed) return;

  const { error } = await supabase
    .from("clientes")
    .update({ estado: "completada" })
    .eq("id", id);

  if (error) {
    return Swal.fire("Error al completar", "", "error");
  }

  Swal.fire("Cita completada", "", "success");
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

    tituloForm.textContent = "Editar cita";
  }
});

txtFecha.addEventListener("change", () => {
  if (txtFecha.value) {
    cargarHorasDisponibles(txtFecha.value);
  }
});

txtHora.addEventListener("change", () => {
  if (!horaValida(txtHora.value)) {
    Swal.fire(
      "Hora inválida",
      "Use intervalos de 30 min entre 8:00am y 5:00pm (sin 12:00 a 1:00)",
      "warning"
    );

    txtHora.value = "";
  }
});


formCita.addEventListener("submit", (e) => {
  e.preventDefault();
  guardarCita();
});

btnCancel.addEventListener("click", limpiarFormulario);


window.onload = () => {
  consultarClientes();

  const hoy = new Date();
  const max = new Date();

  max.setMonth(max.getMonth() + 2);

  const formato = (f) => f.toISOString().split("T")[0];

  txtFecha.min = formato(hoy);
  txtFecha.max = formato(max);
};