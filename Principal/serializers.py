from rest_framework import serializers
from .models import Paciente

class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields =  ['id', 'cedula', 'nombres', 'apellidos', 'fecha_nacimiento',
                 'telefono', 'direccion', 'correo', 'sexo', 'discapacidad',
                 'orientacion_sexual', 'grupo_sanguineo']

    def validate_cedula(self, value):
        # Validar que la cédula tenga 10 dígitos
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("La cédula debe tener 10 dígitos numéricos")
        return value

    def validate_telefono(self, value):
        # Validar que el teléfono tenga formato válido
        if not value.isdigit() or len(value) < 7:
            raise serializers.ValidationError("El teléfono debe contener solo números")
        return value