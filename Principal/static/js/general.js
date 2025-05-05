// Funciones de navegación
function Salir() {
    window.location.href = urlInicio;
}

function Citas() {
    window.location.href = urlCitas;
}

function Historial() {
    window.location.href = urlHistorial;
}

function showLoginMessage() {
    Swal.fire({
        title: 'Error',
        text: 'Por favor, inicia sesión para acceder a esta funcionalidad.',
        icon: 'error',
        position: 'top-end',          // Posición (superior derecha)
        showConfirmButton: false,     // No mostrar botón de confirmación
        timer: 1300,                  // Duración en ms 
        toast: true,                 // Activar modo Toast
        background: '#fff3cd',       // Fondo amarillo claro (opcional)
        iconColor: '#dc3545',         // Color del icono (rojo)
    });
}

// Funciones de manejo del sidebar
function openNav() {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("sidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

// Funciones de manejo de popups
function openLoginPopup() {
    document.getElementById('loginPopup').style.display = 'flex';
}

function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
        document.body.classList.remove('popup-open');
    }
}

// Utilidad para obtener CSRF token
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

// Event listeners globales
document.addEventListener('DOMContentLoaded', function() {
    // Cerrar popups con Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === "Escape") {
            const popups = document.querySelectorAll('.popup');
            popups.forEach(popup => {
                if (popup.style.display === "flex") {
                    closePopup(popup.id);
                }
            });
            closeNav();
        }
    });

    // Cerrar popups al hacer clic fuera
    document.addEventListener('click', function(event) {
        const popups = document.querySelectorAll('.popup');
        popups.forEach(function(popup) {
            if (popup.style.display === 'flex') {
                const popupContent = popup.querySelector('.popup-content');
                if (!popupContent.contains(event.target) && !event.target.closest('.btn')) {
                    closePopup(popup.id);
                }
            }
        });
    });
});
