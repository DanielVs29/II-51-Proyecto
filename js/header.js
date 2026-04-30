import { supabase } from "./supabase.js";

async function cargarMenu() {

    const { data: { user } } = await supabase.auth.getUser();

    const nav = document.querySelector(".nav-list");

    if (!nav) return;

    nav.innerHTML = `
        <li><a href="index.html">Inicio</a></li>
        <li><a href="localidades.html">Localidades</a></li>
        <li><a href="contacto.html">Contacto</a></li>
    `;

  
    if (!user) {
        nav.innerHTML += `
            <li><a href="login.html">Iniciar sesión</a></li>
        `;
        return;
    }

    const { data: cliente, error } = await supabase
        .from("clientes")
        .select(`
            perfiles (
                nombre
            )
        `)
        .eq("auth_id", user.id)
        .maybeSingle();

    if (error) {
        console.log(error);
        return;
    }

    const perfil = cliente?.perfiles?.nombre;

    if (perfil === "admin") {
        nav.innerHTML += `
            <li><a href="adminCitas.html">Administrar citas</a></li>
        `;
    }


    else {
        nav.innerHTML += `
            <li><a href="AgendarCita.html">Agendar cita</a></li>
            <li><a href="clienteCitas.html">Mis citas</a></li>
        `;
    }


    nav.innerHTML += `
        <li><a href="#" id="cerrarSesion">Salir</a></li>
    `;

    document.getElementById("cerrarSesion")
        .addEventListener("click", async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            location.href = "index.html";
        });
}

cargarMenu();