# Generated by Django 5.0.6 on 2025-05-01 01:07

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Principal', '0004_antecedentes_enfermedad_cardiaca_detalle_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='MotivoConsulta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('motivo', models.TextField()),
                ('problema_actual', models.TextField()),
                ('fecha_registro', models.DateTimeField(auto_now_add=True)),
                ('paciente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='Principal.paciente')),
            ],
            options={
                'ordering': ['-fecha_registro'],
            },
        ),
    ]
