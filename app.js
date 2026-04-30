import { supabase } from "./js/supabase.js";

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

/* ===================================================
   CONSULTAR CITAS
=================================================== */

const consultarClientes = async () => {
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
        nombre,
        apellido
      ),

      servicios (
        nombre,
        precio
      )
    `)
    .order("fecha_hora", { ascending: true });

  if (error) {
    console.error(error);
    return Swal.fire("Error cargando citas", "", "error");
  }

  tbody.innerHTML = "";

  data.forEach((r) => {
    let fecha = "";
    let hora = "";

    if (r.fecha_hora) {
      const [f, h] = r.fecha_hora.split("T");
      fecha = f;
      hora = h.slice(0, 5);
    }

    const cliente = r.clientes ?? {};
    const profesional = r.profesionales ?? {};
    const servicio = r.servicios ?? {};

    const nombreProfesional =
      profesional.nombre
        ? `${profesional.nombre} ${profesional.apellido ?? ""}`
        : "Sin asignar";

    const nombreServicio =
      servicio.nombre ?? "Sin servicio";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${cliente.nombre ?? ""}</td>
      <td>${cliente.apellido ?? ""}</td>
      <td>${cliente.cedula ?? ""}</td>
      <td>${cliente.telefono ?? ""}</td>
      <td>${fecha}</td>
      <td>${hora}</td>
      <td>${r.estado}</td>
      <td>
        ${nombreProfesional}<br>
        <small>${nombreServicio}</small>
      </td>
      <td>
        <button class="btnEditar" data-id="${r.id}">Editar</button>
        <button class="btnCancelar" data-id="${r.id}">Cancelar</button>
        <button class="btnCompletar" data-id="${r.id}">Completar</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
};

/* ===================================================
   GUARDAR CITA
=================================================== */
const guardarCita = async () => {
  const nombre = txtNombre.value.trim();
  const apellido = txtApellido.value.trim();
  const cedula = txtCedula.value.trim();
  const telefono = txtTelefono.value.trim();

  const fecha = txtFecha.value;
  const hora = txtHora.value;

  if (!nombre || !apellido || !cedula || !telefono || !fecha || !hora) {
    return Swal.fire("Complete los campos", "", "warning");
  }

  if (!horaValida(hora)) {
    return Swal.fire(
      "Hora inválida",
      "Solo citas cada 30 min entre 8am y 5pm",
      "warning"
    );
  }

  const fechaHora = `${fecha}T${hora}`;

  let clienteId;

  /* Buscar cliente */
  const { data: clienteExiste } = await supabase
    .from("clientes")
    .select("id")
    .eq("cedula", cedula)
    .maybeSingle();

  if (clienteExiste) {
    clienteId = clienteExiste.id;

    await supabase
      .from("clientes")
      .update({
        nombre,
        apellido,
        telefono
      })
      .eq("id", clienteId);

  } else {
    const { data: nuevoCliente, error } = await supabase
      .from("clientes")
      .insert([
        {
          nombre,
          apellido,
          cedula,
          telefono
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return Swal.fire("Error guardando cliente", "", "error");
    }

    clienteId = nuevoCliente.id;
  }

  /* Profesional por defecto */
  const { data: profesional } = await supabase
    .from("profesionales")
    .select("id")
    .limit(1)
    .maybeSingle();

  /* Servicio por defecto */
  const { data: servicio } = await supabase
    .from("servicios")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;

  if (txtId.value) {
    ({ error } = await supabase
      .from("citas")
      .update({
        fecha_hora: fechaHora,
        cliente_id: clienteId,
        profesional_id: profesional?.id ?? null,
        servicio_id: servicio?.id ?? null
      })
      .eq("id", txtId.value));

  } else {
    ({ error } = await supabase
      .from("citas")
      .insert([
        {
          cliente_id: clienteId,
          fecha_hora: fechaHora,
          estado: "pendiente",
          profesional_id: profesional?.id ?? null,
          servicio_id: servicio?.id ?? null
        }
      ]));
  }

  if (error) {
    console.error(error);
    return Swal.fire("Error guardando cita", "", "error");
  }

  Swal.fire("Guardado correctamente", "", "success");

  limpiarFormulario();
  consultarClientes();
};

/* ===================================================
   LIMPIAR
=================================================== */
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

/* ===================================================
   VALIDAR HORA
=================================================== */
const horaValida = (hora) => {
  const [h, m] = hora.split(":").map(Number);

  const minutos = h * 60 + m;

  if (minutos < 480 || minutos > 1020) return false;
  if (minutos >= 720 && minutos < 780) return false;
  if (m !== 0 && m !== 30) return false;

  return true;
};

/* ===================================================
   HORAS DISPONIBLES
=================================================== */
const cargarHorasDisponibles = async (fechaSeleccionada) => {
  const horasBase = [
    "08:00","08:30","09:00","09:30",
    "10:00","10:30","11:00","11:30",
    "13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00"
  ];

  const { data, error } = await supabase
    .from("citas")
    .select("fecha_hora")
    .eq("estado", "pendiente")
    .gte("fecha_hora", `${fechaSeleccionada}T00:00:00`)
    .lt("fecha_hora", `${fechaSeleccionada}T23:59:59`);

  if (error) return;

  const horasOcupadas = data.map((c) =>
    c.fecha_hora.split("T")[1].slice(0, 5)
  );

  txtHora.innerHTML =
    `<option value="" disabled selected>Seleccione una hora</option>`;

  horasBase.forEach((hora) => {
    if (!horasOcupadas.includes(hora)) {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      txtHora.appendChild(option);
    }
  });
};

/* ===================================================
   EVENTOS TABLA
=================================================== */
tbody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;

  /* CANCELAR */
  if (e.target.classList.contains("btnCancelar")) {
    const result = await Swal.fire({
      title: "¿Cancelar cita?",
      icon: "warning",
      showCancelButton: true
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("citas")
      .update({ estado: "cancelada" })
      .eq("id", id);

    if (error) {
      return Swal.fire("Error al cancelar", "", "error");
    }

    Swal.fire("Cita cancelada", "", "success");
    consultarClientes();
  }

  /* COMPLETAR */
  if (e.target.classList.contains("btnCompletar")) {
    const result = await Swal.fire({
      title: "¿Completar cita?",
      icon: "question",
      showCancelButton: true
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("citas")
      .update({ estado: "completada" })
      .eq("id", id);

    if (error) {
      return Swal.fire("Error al completar", "", "error");
    }

    Swal.fire("Cita completada", "", "success");
    consultarClientes();
  }

  /* EDITAR */
  if (e.target.classList.contains("btnEditar")) {
    const { data, error } = await supabase
      .from("citas")
      .select(`
        id,
        fecha_hora,
        clientes (
          nombre,
          apellido,
          cedula,
          telefono
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return Swal.fire("Error al cargar cita", "", "error");
    }

    const cliente = data.clientes;

    txtId.value = data.id;

    txtNombre.value = cliente.nombre;
    txtApellido.value = cliente.apellido;
    txtCedula.value = cliente.cedula;
    txtTelefono.value = cliente.telefono;

    const [fecha, horaCompleta] = data.fecha_hora.split("T");

    txtFecha.value = fecha;

    await cargarHorasDisponibles(fecha);

    txtHora.value = horaCompleta.slice(0, 5);

    tituloForm.textContent = "Editar cita";
  }
});

/* ===================================================
   EVENTOS INPUTS
=================================================== */
txtFecha.addEventListener("change", () => {
  if (txtFecha.value) {
    cargarHorasDisponibles(txtFecha.value);
  }
});

txtHora.addEventListener("change", () => {
  if (!horaValida(txtHora.value)) {
    Swal.fire(
      "Hora inválida",
      "Use intervalos de 30 min entre 8am y 5pm",
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

/* ===================================================
   INICIO
=================================================== */
window.onload = () => {
  consultarClientes();

  const hoy = new Date();
  const max = new Date();

  max.setMonth(max.getMonth() + 2);

  const formato = (f) => f.toISOString().split("T")[0];

  txtFecha.min = formato(hoy);
  txtFecha.max = formato(max);
};