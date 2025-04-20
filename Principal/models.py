from django.db import models

class Paciente(models.Model):
    SEXO_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Femenino', 'Femenino'),
        ('Sin especificar', 'Sin especificar')
    ]
    GRUPO_SANGUINEO_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-')
    ]
    ORIENTACION_SEXUAL_CHOICES = [
        ('Heterosexual', 'Heterosexual'),
        ('Homosexual', 'Homosexual'),
        ('Bisexual', 'Bisexual'),
        ('Otro', 'Otro')
    ]
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    cedula = models.CharField(max_length=10, unique=True)
    fecha_nacimiento = models.DateField()
    telefono = models.CharField(max_length=15, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    # Nuevos campos
    sexo = models.CharField(max_length=20, choices=SEXO_CHOICES, default='Sin especificar')
    discapacidad = models.BooleanField(default=False)
    orientacion_sexual = models.CharField(max_length=50, blank=True, null=True, choices=ORIENTACION_SEXUAL_CHOICES, default='Otro')
    grupo_sanguineo = models.CharField(max_length=3, choices=GRUPO_SANGUINEO_CHOICES, default='O+')

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class Cita(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField()
    motivo = models.TextField()
    estado = models.CharField(
        max_length=20, 
        choices=[('Pendiente', 'Pendiente'), ('Confirmada', 'Confirmada'), 
                ('Cancelada', 'Cancelada'), ('Completada', 'Completada')],
        default='Pendiente'
    )
    google_event_id = models.CharField(max_length=255, blank=True, null=True)  # Nuevo campo

    def __str__(self):
        return f"Cita con {self.paciente.nombres} {self.paciente.apellidos} - {self.fecha_hora}"

class Tratamiento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    costo_total = models.DecimalField(max_digits=10, decimal_places=2)
    requiere_pagos_parciales = models.BooleanField(default=False)  # Define si el tratamiento se paga en cuotas

    def __str__(self):
        return self.nombre

class HistoriaClinica(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    fecha = models.DateField(auto_now_add=True)
    notas = models.TextField()
    
    def __str__(self):
        return f"Historia clínica de {self.paciente} - {self.fecha}"

class TratamientoPaciente(models.Model):
    historia_clinica = models.ForeignKey(HistoriaClinica, on_delete=models.CASCADE)  # Se agrega esta clave foránea
    tratamiento = models.ForeignKey(Tratamiento, on_delete=models.CASCADE)
    fecha_inicio = models.DateField(auto_now_add=True)
    saldo_pendiente = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Controla cuánto falta por pagar

    def __str__(self):
        return f"{self.historia_clinica.paciente} - {self.tratamiento} (Saldo: {self.saldo_pendiente})"

class PagoTratamiento(models.Model):
    tratamiento_paciente = models.ForeignKey(TratamientoPaciente, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(
        max_length=20, 
        choices=[('Efectivo', 'Efectivo'), ('Tarjeta', 'Tarjeta'), ('Transferencia', 'Transferencia')],
        default='Efectivo'
    )

    def __str__(self):
        return f"Pago de {self.monto} para {self.tratamiento_paciente.historia_clinica.paciente} - {self.tratamiento_paciente.tratamiento}"
