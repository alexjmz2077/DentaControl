document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los event listeners de las pestañas
    initializeTabs();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover clase active de todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            // Agregar clase active a la pestaña clickeada
            tab.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const tabId = tab.getAttribute('data-tab');
            showTabContent(tabId);
        });
    });
}

function showTabContent(tabId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    // Mostrar el contenido seleccionado
    document.getElementById(tabId).classList.add('active');
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (meses < 0 || (meses === 0 && dias < 0)) {
        años--;
        meses += 12;
    }
    
    if (dias < 0) {
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
        meses--;
    }

    return `${años} años, ${meses} meses, ${dias} días`;
}

function buscarPaciente() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula || cedula.length !== 10) {
        alert('Por favor, ingrese una cédula válida');
        return;
    }

    // Llamada al API
    fetch(`/api/pacientes/${cedula}/`)
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                mostrarInformacionPaciente(response.data);
            } else {
                alert('No se encontró el paciente');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al buscar el paciente');
        });
}

function mostrarInformacionPaciente(paciente) {
    // Mostrar secciones ocultas
    document.getElementById('pacienteInfo').style.display = 'block';
    document.getElementById('megaMenu').style.display = 'block';

    // Actualizar información del paciente
    document.getElementById('nombresPaciente').textContent = `${paciente.nombres} ${paciente.apellidos}`;
    document.getElementById('fechaNacimiento').textContent = formatearFecha(paciente.fecha_nacimiento);
    document.getElementById('edadPaciente').textContent = calcularEdad(paciente.fecha_nacimiento);
    
    // Actualizar los campos que faltan
    document.getElementById('sexoPaciente').textContent = paciente.sexo ;
    document.getElementById('discapacidadPaciente').textContent = paciente.discapacidad === true ? 'Sí' : 'No';
    document.getElementById('orientacionPaciente').textContent = paciente.orientacion_sexual || 'No especificado';
    document.getElementById('grupoSanguineoPaciente').textContent = paciente.grupo_sanguineo || 'No especificado';
}

// Agregar función para formatear la fecha
function formatearFecha(fecha) {
    if (!fecha) return 'No especificada';
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC' 
    });
}