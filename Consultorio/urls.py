"""
URL configuration for Consultorio project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from Principal import views
from django.contrib.auth import views as auth_views
from Principal.views import crear_paciente_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.inicio, name='inicio'),
    path('citas/', views.citas, name='citas'),
    path('historial/', views.historial, name='historial'),

    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', auth_views.LogoutView.as_view(next_page='inicio'), name='logout'),
    path('validar_cedula/', views.validar_cedula, name='validar_cedula'),
    path('obtener_pacientes/', views.obtener_pacientes, name='obtener_pacientes'),
    path('obtener_pacientes_lista/', views.obtener_pacientes_lista, name='obtener_pacientes_lista'),
    path('actualizar_paciente/<int:id>/', views.actualizar_paciente, name='actualizar_paciente'),
    path('eliminar_paciente/<int:id>/', views.eliminar_paciente, name='eliminar_paciente'),

    path('obtener_citas/', views.obtener_citas, name='obtener_citas'),
    path('guardar_cita/', views.guardar_cita, name='guardar_cita'),
    path('editar_cita/<str:id>/', views.editar_cita, name='editar_cita'),
    path('eliminar_cita/<str:id>/', views.eliminar_cita, name='eliminar_cita'),
    path('oauth2callback/', views.oauth2callback, name='oauth2callback'),
    path('google_auth/', views.google_auth, name='google_auth'),
    
    path('api/pacientes/', crear_paciente_api, name='api_crear_paciente'),
    path('api/pacientes/<str:cedula>/', views.obtener_paciente_api, name='api_obtener_paciente'),


    path('api/antecedentes/<str:cedula>/', views.obtener_antecedentes, name='obtener_antecedentes'),
    path('api/guardar_antecedentes/', views.guardar_antecedentes, name='guardar_antecedentes'),
    path('api/guardar_motivo/', views.guardar_motivo, name='guardar_motivo'),
    path('api/consultas/<str:cedula>/', views.obtener_consultas, name='obtener_consultas'),
    path('api/eliminar_consulta/', views.eliminar_consulta, name='eliminar_consulta'),
]
