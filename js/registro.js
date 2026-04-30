import { supabase } from "./supabase.js";

const form = document.getElementById("formRegistro");

const txtNombre = document.getElementById("txtNombre");
const txtApellido = document.getElementById("txtApellido");
const txtCorreo = document.getElementById("txtCorreo");
const txtContrasena = document.getElementById("txtContrasena");
const txtCedula = document.getElementById("txtCedula");
const txtTelefono = document.getElementById("txtTelefono");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = txtNombre.value.trim();
    const apellido = txtApellido.value.trim();
    const cedula = txtCedula.value.trim();
    const telefono = txtTelefono.value.trim();
    const correo = txtCorreo.value.trim().toLowerCase();
    const contrasena = txtContrasena.value.trim();

    const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: contrasena
    });

    if (error) {
        console.log(error);
        return Swal.fire("Error", error.message, "error");
    }

    const user = data.user;

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("id")
        .eq("nombre", "usuario")
        .single();

    const { error: errorCliente } = await supabase
        .from("clientes")
        .insert([{
            nombre,
            apellido,
            cedula,
            telefono,
            correo,
            auth_id: user.id,
            perfil_id: perfil.id
        }]);

    if (errorCliente) {
        console.log(errorCliente);
        return Swal.fire("Error", "No se pudo crear cliente", "error");
    }

    await Swal.fire("Cuenta creada", "Favor inicie sesion.", "success");

    window.location.href = "login.html";
});