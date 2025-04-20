setTimeout(() => {
    closePopup('successPopup');
}, 3000);

// Cerrar el popup al presionar "Esc"
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closePopup('successPopup');
    }
});

// Función para cerrar el popup
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
    }
}

// Eliminar estas funciones ya que no se usan:
// function Pagina2() {
//     window.location.href = urlRecomendaciones;
// }
// function PaginaAnalisis(){
//     window.location.href = urlAnalisis;
// }

function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
};

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
};

function openLoginPopup() {
    document.getElementById('loginPopup').style.display = 'flex';
}

function openRegisterPopup() {
    document.getElementById('registerPopup').style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}



function tutorial() {

    const driver = window.driver.js.driver;

    const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous'],
    steps: [
        {element: '.menu',  
        popover: {
            title: 'Menú',
            description: 'Usa este botón para abrir el menú y navegar entre las secciones.',

        }},
        {
            element: '.auth-buttons', // Sección de autenticación
            popover: {
                title: 'Autenticación',
                description: 'Si no has iniciado sesión, haz clic aquí para iniciar o registrarte.',

            }
        },
        {
            element: '#startButton',
            popover: {
                title: 'Empezar',
                description: 'Haz clic aquí para comenzar.',

            }
        },
    ]
    });
    driverObj.drive();
}


function tutorial2() {

    const driver = window.driver.js.driver;

    const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous'],
    steps: [
        {
            element: '#resultadosButton',
            popover: {
                title: 'Resultados',
                description: 'Aquí puedes ver los resultados.',
                position: 'bottom'
            }
        },
        {
            element: '#salirButton',
            popover: {
                title: 'Salir',
                description: 'Haz clic aquí para salir.',
                position: 'bottom'
            }
        },
        {
            element: '#label-container',
            popover: {
                title: 'Errores Peso Muerto',
                description: 'Aqui puedes visualizar los errores en tiempo real',
                position: 'bottom'
            }
        },
    ]
    });
    driverObj.drive();
}


function tutorial3() {

    const driver = window.driver.js.driver;

    const driverObj = driver({
    showProgress: true,
    showButtons: ['next', 'previous'],
    steps: [
        {
            element: '#csv',
            popover: {
                title: 'Guardar CSV',
                description: 'Haz clic aquí para descargar los resultados en formato CSV.',
                position: 'bottom'
            }
        },
        {
            element: '#pdf',
            popover: {
                title: 'Guardar PDF',
                description: 'Haz clic aquí para descargar los resultados en formato PDF.',
                position: 'bottom'
            }
        },
        {
            element: '#salirButton2',
            popover: {
                title: 'Salir',
                description: 'Haz clic aquí para salir.',
                position: 'bottom'
            }
        },
    ]
    });
    driverObj.drive();
}



// Agregar un listener para detectar la tecla "Esc"
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") { // Detecta la tecla "Esc"
        // Cierra el popup si está abierto
        var popups = document.querySelectorAll('.popup');
        popups.forEach(function(popup) {
            if (popup.style.display === "flex") {
                popup.style.display = "none";
            }
        });

         // Cierra el sidebar si está abierto
         var sidebar = document.getElementById("sidebar");
         if (sidebar.style.width === "250px") {
             closeNav(); // Llama a la función que cierra el sidebar
         }
    }
});



let cedulaValida = true; // Variable global para controlar la validez de la cédula

function validarCedula(cedula) {
    const errorElement = document.getElementById('cedulaError');

    // Validar que la cédula tenga exactamente 10 dígitos
    if (cedula.length !== 10 || isNaN(cedula)) {
        errorElement.textContent = 'La cédula debe tener exactamente 10 dígitos.';
        errorElement.style.display = 'block';
        cedulaValida = false; // Marcar como inválida
        return;
    }

    // Validar si la cédula ya está registrada
    fetch(`/validar_cedula/?cedula=${cedula}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                errorElement.textContent = data.message; // Mensaje desde el servidor
                errorElement.style.display = 'block';
                cedulaValida = false; // Marcar como inválida
            } else {
                errorElement.style.display = 'none';
                cedulaValida = true; // Marcar como válida
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorElement.textContent = 'Error al validar la cédula. Intente nuevamente.';
            errorElement.style.display = 'block';
            cedulaValida = false; // Marcar como inválida en caso de error
        });
}

function validarFormulario() {
    if (!cedulaValida) {
        alert('Por favor, corrija los errores en la cédula antes de enviar el formulario.');
        return false; // Evitar el envío del formulario
    }
    return true; // Permitir el envío si todo está bien
}

function verPacientes() {
    document.getElementById('pacientesPopup').style.display = 'flex';
    cargarPacientes();
}

function handleKeyPress(event) {
    // Verifica si la tecla presionada es "Enter" (código 13)
    if (event.keyCode === 13) {
        // Llama a la función cargarPacientes con el valor del input
        cargarPacientes(document.getElementById('filtroTexto').value);
    }
}

function cargarPacientes(filtro = '') {
    fetch('/obtener_pacientes/?filtro=' + encodeURIComponent(filtro))
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#tablaPacientes tbody');
            tbody.innerHTML = '';
            
            data.forEach(paciente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${paciente.cedula}</td>
                    <td contenteditable="true" data-field="nombres" data-id="${paciente.id}">${paciente.nombres}</td>
                    <td contenteditable="true" data-field="apellidos" data-id="${paciente.id}">${paciente.apellidos}</td>
                    <td contenteditable="true" data-field="fecha_nacimiento" data-id="${paciente.id}">${paciente.fecha_nacimiento}</td>
                    <td contenteditable="true" data-field="sexo" data-id="${paciente.id}">${paciente.sexo}</td>
                    <td contenteditable="true" data-field="discapacidad" data-id="${paciente.id}">${paciente.discapacidad ? 'Sí' : 'No'}</td>
                    <td contenteditable="true" data-field="orientacion_sexual" data-id="${paciente.id}">${paciente.orientacion_sexual || ''}</td>
                    <td contenteditable="true" data-field="grupo_sanguineo" data-id="${paciente.id}">${paciente.grupo_sanguineo}</td>
                    <td contenteditable="true" data-field="telefono" data-id="${paciente.id}">${paciente.telefono || ''}</td>
                    <td contenteditable="true" data-field="direccion" data-id="${paciente.id}">${paciente.direccion || ''}</td>
                    <td contenteditable="true" data-field="correo" data-id="${paciente.id}">${paciente.correo || ''}</td>
                    <td class="action-buttons">
                        <img src="/static/img/save.png" alt="Guardar" class="action-icon" onclick="guardarCambios(${paciente.id}, this.closest('tr'))" title="Guardar cambios">
                        <img src="/static/img/delete.png" alt="Eliminar" class="action-icon" onclick="confirmarEliminar(${paciente.id})" title="Eliminar paciente">
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function guardarCambios(id, row) {
    const datos = {
        nombres: row.querySelector('[data-field="nombres"]').textContent,
        apellidos: row.querySelector('[data-field="apellidos"]').textContent,
        fecha_nacimiento: row.querySelector('[data-field="fecha_nacimiento"]').textContent,
        telefono: row.querySelector('[data-field="telefono"]').textContent,
        direccion: row.querySelector('[data-field="direccion"]').textContent,
        correo: row.querySelector('[data-field="correo"]').textContent,
        sexo: row.querySelector('[data-field="sexo"]').textContent,
        discapacidad: row.querySelector('[data-field="discapacidad"]').textContent === 'Sí',
        orientacion_sexual: row.querySelector('[data-field="orientacion_sexual"]').textContent,
        grupo_sanguineo: row.querySelector('[data-field="grupo_sanguineo"]').textContent
    };

    fetch(`/actualizar_paciente/${id}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(datos)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Datos actualizados correctamente');
        } else {
            alert('Error al actualizar los datos');
        }
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function confirmarEliminar(id) {
    // Eliminar popup anterior si existe
    const existingPopup = document.getElementById('confirmDeletePopup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.id = 'confirmDeletePopup';
    popup.style.display = 'flex';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close" onclick="closePopup('confirmDeletePopup')">&times;</span>
            <h2>Confirmar eliminación</h2>
            <p>¿Estás seguro de eliminar la información del paciente?</p>
            <div class="popup-buttons">
                <button class="btn" onclick="eliminarPaciente(${id})">Sí</button>
                <button class="btn inverted" onclick="cerrarPopupEliminar()">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

function eliminarPaciente(id) {
    fetch(`/eliminar_paciente/${id}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cargarPacientes(); // Recargar la tabla
            cerrarPopupEliminar(); // Usar la nueva función
            alert('Paciente eliminado correctamente');
        } else {
            alert('Error al eliminar el paciente');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar el paciente');
    })
    .finally(() => {
        cerrarPopupEliminar(); // Asegurarnos de que el popup se cierre incluso si hay un error
    });
}

function cerrarPopupEliminar() {
    const popup = document.getElementById('confirmDeletePopup');
    if (popup) {
        popup.remove(); // Eliminamos el elemento del DOM en lugar de solo ocultarlo
    }
}

// Agregar evento cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Agregar listener para cerrar popups al hacer clic fuera
    document.addEventListener('click', function(event) {
        const popups = document.querySelectorAll('.popup');
        popups.forEach(function(popup) {
            if (popup.style.display === 'flex') {
                // Verificar si el clic fue fuera del contenido del popup
                const popupContent = popup.querySelector('.popup-content');
                if (!popupContent.contains(event.target) && !event.target.closest('.btn')) {
                    closePopup(popup.id);
                }
            }
        });
    });

    // Evitar que los clics dentro del popup cierren el popup
    const popupContents = document.querySelectorAll('.popup-content');
    popupContents.forEach(function(content) {
        content.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    });

    // Añadir listener para la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            cerrarPopupEliminar();
        }
    });

    // Añadir listener para clicks fuera del popup
    document.addEventListener('click', function(event) {
        const popup = document.getElementById('confirmDeletePopup');
        if (popup && !popup.querySelector('.popup-content').contains(event.target)) {
            cerrarPopupEliminar();
        }
    });
});


