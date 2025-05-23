# Generated by Django 5.0.6 on 2025-04-22 15:33

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Paciente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombres', models.CharField(max_length=100)),
                ('apellidos', models.CharField(max_length=100)),
                ('cedula', models.CharField(max_length=10, unique=True)),
                ('fecha_nacimiento', models.DateField()),
                ('telefono', models.CharField(blank=True, max_length=15, null=True)),
                ('direccion', models.CharField(blank=True, max_length=255, null=True)),
                ('correo', models.EmailField(blank=True, max_length=254, null=True)),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
                ('sexo', models.CharField(choices=[('Masculino', 'Masculino'), ('Femenino', 'Femenino'), ('Sin especificar', 'Sin especificar')], default='Sin especificar', max_length=20)),
                ('discapacidad', models.BooleanField(default=False)),
                ('orientacion_sexual', models.CharField(blank=True, choices=[('Heterosexual', 'Heterosexual'), ('Homosexual', 'Homosexual'), ('Bisexual', 'Bisexual'), ('Otro', 'Otro')], default='Otro', max_length=50, null=True)),
                ('grupo_sanguineo', models.CharField(choices=[('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-')], default='O+', max_length=3)),
            ],
        ),
    ]
