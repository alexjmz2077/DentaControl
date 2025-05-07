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
        ('O-', 'O-'),
        ('No sabe', 'No sabe')
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
    grupo_sanguineo = models.CharField(max_length=15, choices=GRUPO_SANGUINEO_CHOICES, default='O+')

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class Antecedentes(models.Model):
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE)
    # Alergias
    alergia_alimentos = models.BooleanField(default=False)
    alergia_alimentos_detalle = models.TextField(blank=True, null=True)
    alergia_medicamentos = models.BooleanField(default=False)
    alergia_medicamentos_detalle = models.TextField(blank=True, null=True)
    alergia_otros = models.BooleanField(default=False)
    alergia_otros_detalle = models.TextField(blank=True, null=True)
    
    # Enfermedades Sistémicas
    hemorragias = models.BooleanField(default=False)
    hemorragias_detalle = models.TextField(blank=True, null=True)  # Nuevo campo
    vih = models.BooleanField(default=False)
    tuberculosis = models.BooleanField(default=False)
    asma = models.BooleanField(default=False)
    diabetes = models.BooleanField(default=False)
    hipertension = models.BooleanField(default=False)
    enfermedad_cardiaca = models.BooleanField(default=False)
    enfermedad_cardiaca_detalle = models.TextField(blank=True, null=True)  # Nuevo campo
    otras_enfermedades = models.BooleanField(default=False)
    otras_enfermedades_detalle = models.TextField(blank=True, null=True)
    
    # Hábitos
    tabaquismo = models.BooleanField(default=False)
    tabaquismo_detalle = models.TextField(blank=True, null=True)
    alcoholismo = models.BooleanField(default=False)
    alcoholismo_detalle = models.TextField(blank=True, null=True)
    dieta_alta_azucares = models.BooleanField(default=False)
    
    # Hábitos de Higiene
    cepillado = models.BooleanField(default=False)
    hilo_dental = models.BooleanField(default=False)
    enjuague = models.BooleanField(default=False)
    
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Antecedentes de {self.paciente}"

class MotivoConsulta(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    motivo = models.TextField()
    problema_actual = models.TextField()
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"Consulta de {self.paciente} - {self.fecha_registro.strftime('%d/%m/%Y %H:%M')}"

class ExamenEstomatognatico(models.Model):
    paciente = models.ForeignKey('Paciente', on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    examen_sin_patologia = models.BooleanField(default=False)
    regiones = models.JSONField(default=dict)
    # Estructura ejemplo:
    # {
    #   "atm": {
    #       "cp": true,
    #       "sp": false,
    #       "patologias": ["absceso", "fibroma"],
    #       "observacion": "Texto..."
    #   },
    #   ...
    # }

    def __str__(self):
        return f"Examen estomatognático de {self.paciente} - {self.fecha.strftime('%d/%m/%Y %H:%M')}"

