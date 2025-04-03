document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'es', // Ya tienes esto
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        nowIndicator: true,  // Mostrar indicador de tiempo actual
        allDaySlot: false,
        locale: 'es',
        selectable: true,
        editable: true,
        events: urlObtenerCitas,
        displayEventEnd: true,  // Mostrar hora de fin
        eventDisplay: 'block',  // Mostrar eventos como bloques
        slotMinTime: '07:00:00',  // Hora de inicio del día
        slotMaxTime: '20:00:00',  // Hora de fin del día
        scrollTime: '07:00:00',   // Hora de inicio del scroll
        eventTimeFormat: {        // Formato de hora
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        select: function(info) {
            openCitaPopup(null, info.start);
        },
        eventClick: function(info) {
            openCitaPopup(info.event);
        },
        eventClassNames: function(arg) {
            // Añadir clase para eventos pasados
            const eventDate = new Date(arg.event.start);
            return eventDate < new Date() ? ['past-event'] : [];
        }
    });
    
    calendar.render();

    // Verificar autenticación de Google Calendar
    async function checkGoogleAuth() {
        try {
            const response = await fetch(urlObtenerCitas);
            const data = await response.json();
            
            if (response.status === 401 || (Array.isArray(data) && data.length === 0)) {
                document.getElementById('gcal-auth').style.display = 'flex';
                calendar.setOption('selectable', false);
            } else {
                document.getElementById('gcal-auth').style.display = 'none';
                calendar.setOption('selectable', true);
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            document.getElementById('gcal-auth').style.display = 'flex';
            calendar.setOption('selectable', false);
        }
    }

    // Verificar autenticación al cargar la página
    checkGoogleAuth();

    // Función para cargar pacientes
    async function cargarPacientes(filtro = '') {
        try {
            const response = await fetch(`${urlObtenerPacientes}?cedula=${filtro}`);
            const pacientes = await response.json();
            const select = document.getElementById('paciente');
            select.innerHTML = '<option value="">Seleccione un paciente</option>';
            pacientes.forEach(paciente => {
                select.innerHTML += `<option value="${paciente.id}">${paciente.nombres} ${paciente.apellidos} - ${paciente.cedula}</option>`;
            });
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
        }
    }

    // Modificar la función openCitaPopup
    window.openCitaPopup = async function(event, defaultDate = null) {
        const popup = document.getElementById('citaPopup');
        document.body.classList.add('popup-open');
        const form = document.getElementById('citaForm');
        const title = document.getElementById('popupTitle');
        const deleteBtn = document.getElementById('eliminarCitaBtn');
        
        // Cargar la lista de pacientes primero
        await cargarPacientes();
        form.reset();
        
        if (event) {
            // Modo edición
            title.textContent = 'Editar Cita';
            
            // Convertir la fecha UTC a local
            const startDate = new Date(event.start);
            const localDateTime = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);

            // Extraer el ID del paciente del título del evento
            const eventTitle = event.title;
            const patientName = eventTitle.replace('Cita con ', '');
            
            // Buscar el paciente en el select
            const pacienteSelect = document.getElementById('paciente');
            const options = Array.from(pacienteSelect.options);
            const option = options.find(opt => opt.text.includes(patientName));
            
            if (option) {
                pacienteSelect.value = option.value;
            }
            
            document.getElementById('fecha_hora').value = localDateTime;
            document.getElementById('motivo').value = event.extendedProps.motivo || '';
            deleteBtn.style.display = 'block';
            form.dataset.citaId = event.id;
            form.dataset.isEdit = 'true';
        } else {
            // Modo nueva cita
            title.textContent = 'Nueva Cita';
            if (defaultDate) {
                const localDateTime = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
                document.getElementById('fecha_hora').value = localDateTime;
            }
            deleteBtn.style.display = 'none';
            delete form.dataset.citaId;
            delete form.dataset.isEdit;
        }
        
        popup.style.display = 'block';
    };

    // Reemplaza la función guardarCita existente con esta
    window.guardarCita = async function() {
        try {
            const form = document.getElementById('citaForm');
            const pacienteSelect = document.getElementById('paciente');
            const fechaHoraInput = document.getElementById('fecha_hora');
            const motivoInput = document.getElementById('motivo');

            if (!pacienteSelect.value || !fechaHoraInput.value || !motivoInput.value) {
                alert('Por favor complete todos los campos');
                return;
            }

            // Crear fecha en la zona horaria local
            const localDate = new Date(fechaHoraInput.value);
            
            // Convertir a ISO string manteniendo la zona horaria
            const fecha_hora = localDate.toLocaleString('sv', { timeZone: 'America/Guayaquil' })
                .replace(' ', 'T');

            const data = {
                paciente: pacienteSelect.value,
                fecha_hora: fecha_hora,
                motivo: motivoInput.value
            };

            console.log('Enviando datos:', data); // Debug

            const isEdit = form.dataset.isEdit === 'true';
            const citaId = form.dataset.citaId;
            const url = isEdit ? `/editar_cita/${citaId}/` : urlGuardarCita;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`Error HTTP: ${response.status}. ${text}`);
            }

            const result = await response.json();
            console.log('Respuesta:', result);
            
            if (result.success) {
                calendar.refetchEvents();
                closePopup('citaPopup');
            } else {
                throw new Error(result.error || 'Error al guardar la cita');
            }
        } catch (error) {
            console.error('Error completo:', error);
            alert('Error al guardar la cita: ' + error.message);
        }
    };

    // Función para eliminar cita
    window.eliminarCita = async function() {
        if (!confirm('¿Está seguro de eliminar esta cita?')) {
            return;
        }

        try {
            const form = document.getElementById('citaForm');
            const eventId = form.dataset.citaId;

            if (!eventId) {
                throw new Error('No se encontró el ID del evento');
            }

            const response = await fetch(`/eliminar_cita/${encodeURIComponent(eventId)}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Response text:', text);
                throw new Error(`Error HTTP: ${response.status}. ${text}`);
            }

            const result = await response.json();
            if (result.success) {
                calendar.refetchEvents();
                closePopup('citaPopup');
            } else {
                throw new Error(result.error || 'Error al eliminar la cita');
            }
        } catch (error) {
            console.error('Error completo:', error);
            alert('Error al eliminar la cita: ' + error.message);
        }
    };

    // Elimina el event listener del formulario si existe
    document.getElementById('citaForm').onsubmit = function(e) {
        e.preventDefault();
        return false;
    };

    // Manejar clic fuera del popup
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('citaPopup');
        const popupContent = popup.querySelector('.popup-content');
        
        if (popup.style.display === 'block' && !popupContent.contains(e.target) && !e.target.closest('.fc-event')) {
            closePopup('citaPopup');
        }
    });

    // Manejar tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('citaPopup');
            if (popup.style.display === 'block') {
                closePopup('citaPopup');
            }
        }
    });

    // Prevenir que los clics dentro del popup cierren el popup
    document.querySelector('.popup-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// Modificar la función closePopup
window.closePopup = function(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = 'none';
    document.body.classList.remove('popup-open');
    
    // Limpiar el formulario al cerrar
    if (popupId === 'citaPopup') {
        const form = document.getElementById('citaForm');
        form.reset();
        delete form.dataset.citaId;
        delete form.dataset.isEdit;
    }
};