import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    const { error: errorLogin } = await supabase.auth.signInWithPassword({
        email: correo,
        password
    });

    if (errorLogin) {
        return Swal.fire("Error", "Credenciales inválidas", "error");
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: cliente, error: errorCliente } = await supabase
        .from("clientes")
        .select(`
            perfil_id,
            perfiles (
                nombre
            )
        `)
        .eq("auth_id", user.id)
        .maybeSingle();

    if (errorCliente || !cliente) {
        return Swal.fire("Error", "Perfil no encontrado", "error");
    }

    const perfil = cliente.perfiles?.nombre;

    if (perfil === "admin") {
        window.location.href = "adminCitas.html";
    } else {
        window.location.href = "AgendarCita.html";
    }
});