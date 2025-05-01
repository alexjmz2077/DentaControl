document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los event listeners de las pestañas
    initializeTabs();
    initializeAntecedentes();
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
        alert('Por favor, ingrese una cédula válida');
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

            await cargarHistorialConsultas();
        } else {
            // Si no se encuentra el paciente, limpiar la información anterior
            document.getElementById('pacienteInfo').style.display = 'none';
            document.getElementById('megaMenu').style.display = 'none';
            alert('No se encontró el paciente');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar la información');
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
        alert('Por favor, busque primero un paciente');
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
            alert('Antecedentes guardados exitosamente');
        } else {
            alert('Error al guardar: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los antecedentes');
    }
}

async function guardarMotivo() {
    const cedula = document.getElementById('cedulaSearch').value;
    if (!cedula) {
        alert('Por favor, busque primero un paciente');
        return;
    }

    const motivo = document.getElementById('motivoText').value.trim();
    const problema = document.getElementById('problemaText').value.trim();

    if (!motivo || !problema) {
        alert('Por favor, complete ambos campos antes de guardar');
        return;
    }

    const data = {
        cedula: cedula,
        motivo: motivo,
        problema_actual: problema
    };

    try {
        const response = await fetch('/api/guardar_motivo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Motivo de consulta guardado exitosamente');
            cargarHistorialConsultas();
            // Limpiar campos
            document.getElementById('motivoText').value = '';
            document.getElementById('problemaText').value = '';
        } else {
            alert('Error al guardar: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el motivo de consulta');
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

// Agregar función para confirmar eliminación
function confirmarEliminarConsulta(consultaId) {
    if (confirm('¿Está seguro que desea eliminar esta consulta?')) {
        eliminarConsulta(consultaId);
    }
}

// Agregar función para eliminar consulta
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
            // Recargar el historial de consultas
            cargarHistorialConsultas();
        } else {
            alert('Error al eliminar: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la consulta');
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