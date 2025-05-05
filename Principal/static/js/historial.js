document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los event listeners de las pestañas
    initializeTabs();
    initializeAntecedentes();

    // Agregar event listener para el campo de cédula
    const cedulaInput = document.getElementById('cedulaSearch');
    cedulaInput.addEventListener('keypress', function(event) {
        // Verificar si la tecla presionada es "Enter"
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevenir el comportamiento por defecto
            buscarPaciente(); // Llamar a la función de búsqueda
        }
    });
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

// Modificar la función limpiarAntecedentes
function limpiarAntecedentes() {
    // Limpiar fecha de actualización
    document.getElementById('fechaActualizacion').textContent = '-';
    
    // Limpiar todos los checkboxes
    document.querySelectorAll('.check-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Limpiar y ocultar todos los textareas
    document.querySelectorAll('.description-input').forEach(textarea => {
        textarea.value = '';
        textarea.classList.add('hidden');
    });
}

// Modificar la función buscarPaciente
async function buscarPaciente() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula || cedula.length !== 10) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, ingrese una cédula válida',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
        return;
    }

    try {
        // Limpiar antecedentes antes de buscar nuevo paciente
        limpiarAntecedentes();

        // Obtener información del paciente
        const respPaciente = await fetch(`/api/pacientes/${cedula}/`);
        const dataPaciente = await respPaciente.json();

        if (dataPaciente.success && dataPaciente.data) {
            mostrarInformacionPaciente(dataPaciente.data);
            
            // Obtener y mostrar antecedentes
            const respAntecedentes = await fetch(`/api/antecedentes/${cedula}/`);
            const dataAntecedentes = await respAntecedentes.json();
            
            if (dataAntecedentes.success && dataAntecedentes.data) {
                mostrarAntecedentes(dataAntecedentes.data);
            }

            //await cargarHistorialConsultas();
        } else {
            // Si no se encuentra el paciente, limpiar la información anterior
            document.getElementById('pacienteInfo').style.display = 'none';
            document.getElementById('megaMenu').style.display = 'none';
            Swal.fire({
                title: 'Error',
                text: 'No se encontró el paciente',
                icon: 'error',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#dc3545'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al buscar la información',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
    }
}

// Modificar la función mostrarInformacionPaciente
function mostrarInformacionPaciente(paciente) {
    // Limpiar campos antes de mostrar nueva información
    document.querySelectorAll('.info-item span').forEach(span => {
        span.textContent = '-';
    });

    // Mostrar secciones ocultas
    document.getElementById('pacienteInfo').style.display = 'block';
    document.getElementById('megaMenu').style.display = 'block';

    // Actualizar información del paciente
    document.getElementById('nombresPaciente').textContent = `${paciente.nombres} ${paciente.apellidos}`;
    document.getElementById('fechaNacimiento').textContent = formatearFecha(paciente.fecha_nacimiento);
    document.getElementById('edadPaciente').textContent = calcularEdad(paciente.fecha_nacimiento);
    document.getElementById('sexoPaciente').textContent = paciente.sexo;
    document.getElementById('discapacidadPaciente').textContent = paciente.discapacidad ? 'Sí' : 'No';
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

function initializeAntecedentes() {
    const triggerInputs = document.querySelectorAll('.trigger-input');
    const textareas = document.querySelectorAll('.description-input');
    
    // Inicializar el auto-resize para todos los textareas
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autoResize);
    });
    
    triggerInputs.forEach(input => {
        input.addEventListener('change', function() {
            const descriptionInput = this.closest('.check-item')
                                       .querySelector('.description-input');
            
            if (descriptionInput) {
                if (this.checked) {
                    descriptionInput.classList.remove('hidden');
                    descriptionInput.setAttribute('required', 'required');
                    // Ajustar altura inicial cuando se muestra
                    autoResize.call(descriptionInput);
                } else {
                    descriptionInput.classList.add('hidden');
                    descriptionInput.removeAttribute('required');
                    descriptionInput.value = '';
                }
            }
        });
    });
}

// Agregar la función de auto-resize
function autoResize() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}

function mostrarAntecedentes(antecedentes) {
    // Mostrar fecha de actualización
    if (antecedentes.fecha_actualizacion) {
        // Convertir la fecha UTC a la zona horaria local
        const fecha = new Date(antecedentes.fecha_actualizacion + 'Z'); // Añadimos 'Z' para indicar que es UTC
        const fechaFormateada = fecha.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Usa la zona horaria local
        });
        document.getElementById('fechaActualizacion').textContent = fechaFormateada;
    } else {
        document.getElementById('fechaActualizacion').textContent = 'Sin actualizaciones previas';
    }

    // Recorrer todos los checkboxes y sus campos de texto
    document.querySelectorAll('.check-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const textarea = item.querySelector('textarea');
        
        if (checkbox) {
            const fieldName = checkbox.name;
            checkbox.checked = antecedentes[fieldName] || false;
            
            // Si hay textarea asociado y el checkbox está marcado
            if (textarea && checkbox.checked) {
                textarea.classList.remove('hidden');
                textarea.value = antecedentes[fieldName + '_detalle'] || '';
                // Ajustar altura después de establecer el valor
                autoResize.call(textarea);
            }
        }
    });
}

async function guardarAntecedentes() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, busque primero un paciente',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
        return;
    }

    const data = {
        cedula: cedula
    };

    // Recopilar datos de todos los checkboxes y textareas
    document.querySelectorAll('.check-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const textarea = item.querySelector('textarea');
        
        if (checkbox) {
            const fieldName = checkbox.name;
            data[fieldName] = checkbox.checked;
            
            if (textarea && checkbox.checked) {
                data[fieldName + '_detalle'] = textarea.value;
            }
        }
    });

    try {
        const response = await fetch('/api/guardar_antecedentes/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                title: 'Éxito',
                text: 'Antecedentes guardados exitosamente',
                icon: 'success',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#28a745'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Error al guardar: ' + result.error,
                icon: 'error',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#dc3545'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al guardar los antecedentes',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
    }
}

// Modificar la función guardarMotivo existente
async function guardarMotivo() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, busque primero un paciente',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
        return;
    }

    const motivo = document.getElementById('motivoText').value.trim();
    const problema = document.getElementById('problemaText').value.trim();

    if (!motivo || !problema) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, complete ambos campos antes de guardar',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
        return;
    }

    try {
        const response = await fetch('/api/guardar_motivo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                cedula: cedula,
                motivo: motivo,
                problema_actual: problema
            })
        });

        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                title: 'Éxito',
                text: 'Motivo de consulta guardado exitosamente',
                icon: 'success',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#28a745'
            });
            // Limpiar campos
            document.getElementById('motivoText').value = '';
            document.getElementById('problemaText').value = '';
            // Invalidar el caché para forzar una nueva carga
            consultasCache = null;
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Error al guardar: ' + result.error,
                icon: 'error',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#dc3545'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al guardar el motivo de consulta',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
    }
}

async function cargarHistorialConsultas() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula) return;

    try {
        const response = await fetch(`/api/consultas/${cedula}/`);
        const data = await response.json();

        if (data.success) {
            const accordion = document.getElementById('consultasAccordion');
            accordion.innerHTML = ''; // Limpiar contenido existente

            data.consultas.forEach(consulta => {
                const item = crearItemAccordion(consulta);
                accordion.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function crearItemAccordion(consulta) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    
    const fecha = new Date(consulta.fecha_registro);
    
    const fechaFormateada = fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    item.innerHTML = `
        <div class="accordion-header">
            <div class="accordion-header-content" onclick="toggleAccordion(this)">
                <span>${fechaFormateada}</span>
                <span class="accordion-icon">▼</span>
            </div>
            <img src="/static/img/delete.png" class="delete-icon" 
                 onclick="confirmarEliminarConsulta('${consulta.id}')" 
                 alt="Eliminar" 
                 title="Eliminar consulta">
        </div>
        <div class="accordion-content">
            <div class="content-section">
                <h4>Motivo de Consulta:</h4>
                <p>${consulta.motivo}</p>
            </div>
            <div class="content-section">
                <h4>Enfermedad o Problema Actual:</h4>
                <p>${consulta.problema_actual}</p>
            </div>
        </div>
    `;

    return item;
}

// Modificar función para confirmar eliminación
function confirmarEliminarConsulta(consultaId) {
    Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar esta consulta?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarConsulta(consultaId);
        }
    });
}

// Modificar la función eliminarConsulta existente
async function eliminarConsulta(consultaId) {
    try {
        const response = await fetch('/api/eliminar_consulta/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                consulta_id: consultaId
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Recargar las consultas desde el servidor
            await recargarHistorial();
            
            Swal.fire({
                title: 'Éxito',
                text: 'Consulta eliminada correctamente',
                icon: 'success',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#28a745'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar: ' + result.error,
                icon: 'error',
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                iconColor: '#dc3545'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al eliminar la consulta',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
    }
}

// Agregar nueva función para recargar el historial
async function recargarHistorial() {
    const cedula = document.getElementById('cedulaSearch').value;
    
    try {
        const response = await fetch(`/api/consultas/${cedula}/`);
        const data = await response.json();
        
        if (data.success) {
            // Actualizar el caché con los nuevos datos
            consultasCache = data.consultas;
            
            // Ajustar la página actual si es necesario
            const totalPages = Math.ceil(consultasCache.length / itemsPerPage);
            if (currentPage > totalPages) {
                currentPage = Math.max(1, totalPages);
            }
            
            // Mostrar las consultas actualizadas
            mostrarConsultasPaginadas();
        } else {
            throw new Error(data.error || 'Error al recargar el historial');
        }
    } catch (error) {
        console.error('Error al recargar el historial:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al actualizar el historial',
            icon: 'error',
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            iconColor: '#dc3545'
        });
    }
}

function toggleAccordion(headerContent) {
    // Obtener el contenedor del accordion-content (que es el siguiente elemento después del accordion-header)
    const content = headerContent.closest('.accordion-header').nextElementSibling;
    const icon = headerContent.querySelector('.accordion-icon');
    
    // Toggle la clase active en el contenido
    content.classList.toggle('active');
    // Rotar el ícono según el estado
    icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
}

// Variables globales para el caché y paginación
let consultasCache = null;
let currentPage = 1;
const itemsPerPage = 10;

// Inicializar componentes del historial
document.addEventListener('DOMContentLoaded', function() {
    const btnHistorial = document.getElementById('btnHistorial');
    const historialModal = document.getElementById('historialModal');
    const closeModal = historialModal.querySelector('.close-modal');
    
    btnHistorial.addEventListener('click', abrirHistorial);
    closeModal.addEventListener('click', cerrarHistorial);
    
    // Cerrar modal al hacer clic fuera
    historialModal.addEventListener('click', function(e) {
        if (e.target === historialModal) {
            cerrarHistorial();
        }
    });

    // Botones de paginación
    document.querySelector('.prev-page').addEventListener('click', () => cambiarPagina(-1));
    document.querySelector('.next-page').addEventListener('click', () => cambiarPagina(1));
});

async function abrirHistorial() {
    const modal = document.getElementById('historialModal');
    const loader = modal.querySelector('.loader');
    const consultasList = modal.querySelector('.consultas-list');
    
    modal.classList.add('active');
    
    // Mostrar loader

    consultasList.innerHTML = '';
    
    try {
        // Usar caché si existe
        if (!consultasCache) {
            const cedula = document.getElementById('cedulaSearch').value;
            const response = await fetch(`/api/consultas/${cedula}/`);
            const data = await response.json();
            
            if (data.success) {
                consultasCache = data.consultas;
            } else {
                throw new Error(data.error || 'Error al cargar el historial');
            }
        }
        
        // Mostrar consultas paginadas
        mostrarConsultasPaginadas();
        
    } catch (error) {
        console.error('Error:', error);
        consultasList.innerHTML = `<p class="error-message">${error.message}</p>`;
    } finally {
        loader.classList.add('hidden');
    }
}

function cerrarHistorial() {
    const modal = document.getElementById('historialModal');
    modal.classList.remove('active');
}

function mostrarConsultasPaginadas() {
    const consultasList = document.querySelector('.consultas-list');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const consultasPaginadas = consultasCache.slice(startIndex, endIndex);
    
    consultasList.innerHTML = '';
    
    consultasPaginadas.forEach(consulta => {
        const fecha = new Date(consulta.fecha_registro);
        const fechaFormateada = fecha.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const consultaElement = document.createElement('div');
        consultaElement.className = 'consulta-item';
        consultaElement.innerHTML = `
            <div class="consulta-header" onclick="toggleConsulta(this)">
                <span class="consulta-fecha">${fechaFormateada}</span>
                <img src="/static/img/delete.png" 
                     class="delete-icon" 
                     onclick="event.stopPropagation(); confirmarEliminarConsulta('${consulta.id}')" 
                     alt="Eliminar" 
                     title="Eliminar consulta">
            </div>
            <div class="consulta-content">
                <div class="consulta-section">
                    <h4>Motivo de Consulta:</h4>
                    <p>${consulta.motivo}</p>
                </div>
                <div class="consulta-section">
                    <h4>Enfermedad o Problema Actual:</h4>
                    <p>${consulta.problema_actual}</p>
                </div>
            </div>
        `;
        
        consultasList.appendChild(consultaElement);
    });
    
    actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
    const totalPages = Math.ceil(consultasCache.length / itemsPerPage);
    const prevButton = document.querySelector('.prev-page');
    const nextButton = document.querySelector('.next-page');
    const currentPageSpan = document.querySelector('.current-page');
    
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    currentPageSpan.textContent = currentPage;
}

function cambiarPagina(delta) {
    const nuevaPagina = currentPage + delta;
    const totalPages = Math.ceil(consultasCache.length / itemsPerPage);
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
        currentPage = nuevaPagina;
        mostrarConsultasPaginadas();
    }
}

function toggleConsulta(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Manejador para examen sin patología
    const examenSinPatologia = document.getElementById('examenSinPatologia');
    const patologiaTriggers = document.querySelectorAll('.patologia-trigger');

    if (examenSinPatologia) {
        examenSinPatologia.addEventListener('change', function() {
            const allRadios = document.querySelectorAll('.examination-table input[type="radio"]');
            const allPanels = document.querySelectorAll('.region-panel');
            
            if (this.checked) {
                allRadios.forEach(radio => {
                    if (radio.value === 'sp') {
                        radio.checked = true;
                    } else {
                        radio.checked = false;
                    }
                });
                allPanels.forEach(panel => panel.classList.add('hidden'));
            } else {
                allRadios.forEach(radio => radio.checked = false);
            }
        });
    }

    // Reemplazar el manejador para radios con patología
    patologiaTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(event) {
            const row = this.closest('.table-row');
            const panel = row.querySelector('.region-panel');
            const spRadio = row.querySelector('input[value="sp"]');
            
            // Si ya está seleccionado, deseleccionar
            if (this.checked && this.dataset.wasChecked === 'true') {
                event.preventDefault(); // Prevenir el comportamiento por defecto del radio
                this.checked = false;
                this.dataset.wasChecked = 'false';
                panel.classList.add('hidden');
                return;
            }
            
            // Marcar el estado actual
            this.dataset.wasChecked = this.checked;
            
            if (this.checked) {
                // Si está marcado CP, mostrar el panel y desmarcar SP
                panel.classList.remove('hidden');
                spRadio.checked = false;
                examenSinPatologia.checked = false;
            } else {
                // Si se desmarca CP, ocultar el panel
                panel.classList.add('hidden');
            }
        });
    });

    // Manejador para radios sin patología
    const spRadios = document.querySelectorAll('input[value="sp"]');
    spRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const row = this.closest('.table-row');
                const cpRadio = row.querySelector('.patologia-trigger');
                const panel = row.querySelector('.region-panel');
                
                // Si se marca SP, desmarcar CP y ocultar panel
                cpRadio.checked = false;
                panel.classList.add('hidden');
            }
        });
    });
});

function guardarExamenEstomatognatico() {
    Swal.fire({
        title: 'Guardando',
        text: 'Guardando examen estomatognático...',
        icon: 'info',
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        iconColor: '#0dcaf0'
    });
}