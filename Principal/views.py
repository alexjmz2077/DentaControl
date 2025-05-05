from django.shortcuts import render
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Paciente, Antecedentes, MotivoConsulta
from django.http import JsonResponse
from django.db.models import Q
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from django.conf import settings
import os
from oauthlib.oauth2.rfc6749.errors import InsecureTransportError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import PacienteSerializer

def validar_cedula(request):
    if request.method == 'GET':
        cedula = request.GET.get('cedula', None)
        if Paciente.objects.filter(cedula=cedula).exists():
            return JsonResponse({'exists': True, 'message': 'La cédula ya está registrada.'})
        return JsonResponse({'exists': False})

def inicio(request):
    context = {}
    
    # Check for login error in session
    if request.session.pop('login_error', False):
        context['login_error'] = True
    
    # Existing session checks
    if request.session.pop('register_success', False):
        context['register_success'] = True
    
    if 'register_error' in request.session:
        context['register_error'] = request.session.pop('register_error')
    
    return render(request, 'inicio.html', context)

def citas(request):
    return render(request, 'citas.html')

def historial(request):
    return render(request, 'historial.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('inicio')
        else:
            # Store error message in session instead of URL parameter
            request.session['login_error'] = True
            return redirect('inicio')
    
    # Si es GET, redirigir a inicio
    return redirect('inicio')

@login_required
def register_view(request):
    if request.method == 'POST':
        try:
            # Obtener los datos del formulario
            cedula = request.POST.get('cedula')
            nombres = request.POST.get('nombres')
            apellidos = request.POST.get('apellidos')
            fecha_nacimiento = request.POST.get('fecha_nacimiento')
            telefono = request.POST.get('telefono')
            direccion = request.POST.get('direccion')
            correo = request.POST.get('correo')
            # Nuevos campos
            sexo = request.POST.get('sexo')
            discapacidad = request.POST.get('discapacidad') == 'True'
            orientacion_sexual = request.POST.get('orientacion_sexual')
            grupo_sanguineo = request.POST.get('grupo_sanguineo')
            
            # Validar y guardar el paciente
            Paciente.objects.create(
                cedula=cedula,
                nombres=nombres,
                apellidos=apellidos,
                fecha_nacimiento=fecha_nacimiento,
                telefono=telefono,
                direccion=direccion,
                correo=correo,
                # Nuevos campos
                sexo=sexo,
                discapacidad=discapacidad,
                orientacion_sexual=orientacion_sexual,
                grupo_sanguineo=grupo_sanguineo
            )
            request.session['register_success'] = True
            return redirect('inicio')
        except Exception as e:
            request.session['register_error'] = str(e)
            return redirect('inicio')

    return redirect('inicio')

@login_required
def obtener_pacientes_lista(request):
    try:
        cedula = request.GET.get('cedula', '')
        query = Q()
        
        if cedula:
            query |= Q(cedula__icontains=cedula)
        
        pacientes = Paciente.objects.filter(query)
        data = [{
            'id': paciente.id,
            'nombres': paciente.nombres,
            'apellidos': paciente.apellidos,
            'cedula': paciente.cedula
        } for paciente in pacientes]
        
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def obtener_pacientes(request):
    filtro = request.GET.get('filtro', '')
    
    if filtro:
        pacientes = Paciente.objects.filter(
            Q(cedula__icontains=filtro) |
            Q(nombres__icontains=filtro) |
            Q(apellidos__icontains=filtro)
        )
    else:
        pacientes = Paciente.objects.all()
    
    data = list(pacientes.values())
    return JsonResponse(data, safe=False)

def actualizar_paciente(request, id):
    if request.method == 'POST':
        try:
            paciente = Paciente.objects.get(id=id)
            datos = json.loads(request.body)
            
            for campo, valor in datos.items():
                setattr(paciente, campo, valor)
            
            paciente.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def eliminar_paciente(request, id):
    if request.method == 'POST':
        try:
            paciente = Paciente.objects.get(id=id)
            paciente.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def oauth2callback(request):
    try:
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        # Usar la ruta desde settings
        flow = Flow.from_client_secrets_file(
            settings.GOOGLE_CALENDAR_CREDENTIALS_FILE,
            scopes=settings.GOOGLE_CALENDAR_SCOPES,
            redirect_uri=request.build_absolute_uri('/oauth2callback/')
        )
        
        # Obtener la URL completa de la solicitud actual
        authorization_response = request.build_absolute_uri()
        
        try:
            flow.fetch_token(authorization_response=authorization_response)
            credentials = flow.credentials
            
            # Guardar credenciales en sesión
            request.session['credentials'] = {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes
            }
            
            return redirect('citas')
            
        except InsecureTransportError:
            print("Error de transporte inseguro - continuando de todos modos en desarrollo")
            # Procesar la respuesta manualmente si es necesario
            return redirect('citas')
            
    except Exception as e:
        print(f"Error en oauth2callback: {str(e)}")
        return JsonResponse({
            'error': str(e)
        }, status=500)

@login_required
def obtener_citas(request):
    try:
        if 'credentials' not in request.session:
            return JsonResponse([], safe=False, status=401)

        creds = Credentials(**request.session['credentials'])
        service = build('calendar', 'v3', credentials=creds)

        # Obtener la fecha hace 1 año
        one_year_ago = (datetime.utcnow() - timedelta(days=365)).isoformat() + 'Z'

        events_result = service.events().list(
            calendarId='primary',
            timeMin=one_year_ago,
            maxResults=2500,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        eventos = []
        current_time = datetime.now()  # Tiempo actual local

        for event in events:
            if event.get('summary', '').startswith('Cita con'):
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                # Convertir la fecha de inicio a datetime local
                event_start = datetime.fromisoformat(start.replace('Z', '+00:00')).replace(tzinfo=None)
                
                # Extraer información adicional del evento
                description = event.get('description', '')
                
                # Determinar si el evento es pasado comparando fechas locales
                is_past = event_start < current_time
                
                eventos.append({
                    'id': event['id'],
                    'title': event['summary'],
                    'start': start,
                    'end': end,
                    'extendedProps': {
                        'motivo': description.split('\n')[0].replace('Motivo: ', '') if description else '',
                    },
                    'className': 'past-event' if is_past else ''
                })

        return JsonResponse(eventos, safe=False)
    except Exception as e:
        print("Error al obtener eventos:", str(e))
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@csrf_exempt
def guardar_cita(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            paciente_id = data.get('paciente')
            fecha_hora = data.get('fecha_hora')
            motivo = data.get('motivo')

            if not all([paciente_id, fecha_hora, motivo]):
                return JsonResponse({
                    'success': False,
                    'error': 'Faltan datos requeridos'
                })
            
            try:
                paciente = Paciente.objects.get(id=paciente_id)
                
                if 'credentials' not in request.session:
                    return JsonResponse({
                        'success': False,
                        'error': 'No hay credenciales de Google Calendar'
                    })

                creds = Credentials(**request.session['credentials'])
                service = build('calendar', 'v3', credentials=creds)
                
                # Convertir la fecha a la zona horaria correcta
                fecha_inicio = datetime.fromisoformat(fecha_hora)
                fecha_fin = fecha_inicio + timedelta(hours=1)

                # Crear evento en Google Calendar
                event = {
                    'summary': f'Cita con {paciente.nombres} {paciente.apellidos}',
                    'description': f'Motivo: {motivo}\nTeléfono: {paciente.telefono}\nCédula: {paciente.cedula}',
                    'start': {
                        'dateTime': fecha_inicio.isoformat(),
                        'timeZone': 'America/Guayaquil',
                    },
                    'end': {
                        'dateTime': fecha_fin.isoformat(),
                        'timeZone': 'America/Guayaquil',
                    },
                    'reminders': {
                        'useDefault': True
                    }
                }

                print("Creando evento:", {
                    'summary': event['summary'],
                    'start': event['start'],
                    'end': event['end'],
                    'timeZone': event['start']['timeZone']
                })  # Debug

                event_result = service.events().insert(
                    calendarId='primary',
                    body=event
                ).execute()
                
                return JsonResponse({
                    'success': True,
                    'id': event_result['id']
                })
                    
            except Paciente.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Paciente no encontrado'
                })
            except Exception as e:
                print("Error detallado:", str(e))
                return JsonResponse({
                    'success': False,
                    'error': f'Error al crear evento en Google Calendar: {str(e)}'
                })
                
        except json.JSONDecodeError as e:
            return JsonResponse({
                'success': False,
                'error': f'Error al decodificar JSON: {str(e)}'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Error general: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    })

@login_required
@csrf_exempt
def editar_cita(request, id):
    if request.method == 'POST':
        try:
            # Debug
            print("Recibiendo solicitud de edición para el evento:", id)
            print("Request body:", request.body.decode('utf-8'))
            
            data = json.loads(request.body.decode('utf-8'))
            paciente = Paciente.objects.get(id=data.get('paciente'))
            fecha_hora = data.get('fecha_hora')
            motivo = data.get('motivo')

            if 'credentials' not in request.session:
                return JsonResponse({
                    'success': False,
                    'error': 'No hay credenciales de Google Calendar'
                })

            creds = Credentials(**request.session['credentials'])
            service = build('calendar', 'v3', credentials=creds)

            # Convertir la fecha a formato ISO
            fecha_inicio = datetime.fromisoformat(fecha_hora.replace('Z', '+00:00'))
            fecha_fin = fecha_inicio + timedelta(hours=1)

            # Crear evento actualizado
            event = {
                'summary': f'Cita con {paciente.nombres} {paciente.apellidos}',
                'description': f'Motivo: {motivo}\nTeléfono: {paciente.telefono}\nCédula: {paciente.cedula}',
                'start': {
                    'dateTime': fecha_inicio.isoformat(),
                    'timeZone': 'America/Guayaquil',
                },
                'end': {
                    'dateTime': fecha_fin.isoformat(),
                    'timeZone': 'America/Guayaquil',
                },
                'reminders': {
                    'useDefault': True
                }
            }

            print("Actualizando evento:", event)  # Debug

            # Actualizar el evento
            updated_event = service.events().update(
                calendarId='primary',
                eventId=id,
                body=event
            ).execute()

            return JsonResponse({
                'success': True,
                'id': updated_event['id']
            })

        except json.JSONDecodeError as e:
            print("Error decodificando JSON:", str(e))
            return JsonResponse({
                'success': False,
                'error': f'Error en formato JSON: {str(e)}'
            })
        except Exception as e:
            print("Error al editar cita:", str(e))
            return JsonResponse({
                'success': False,
                'error': str(e)
            })

    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    })

@login_required
@csrf_exempt
def eliminar_cita(request, id):
    if request.method == 'POST':
        try:
            if 'credentials' not in request.session:
                return JsonResponse({
                    'success': False,
                    'error': 'No hay credenciales de Google Calendar'
                })

            creds = Credentials(**request.session['credentials'])
            service = build('calendar', 'v3', credentials=creds)
            
            # Eliminar directamente el evento usando su ID
            service.events().delete(
                calendarId='primary',
                eventId=id
            ).execute()
            
            return JsonResponse({'success': True})
            
        except Exception as e:
            print("Error al eliminar cita:", str(e))
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    })

@login_required
def google_auth(request):
    try:
        # Verificar si el archivo existe
        if not os.path.exists(settings.GOOGLE_CALENDAR_CREDENTIALS_FILE):
            print(f"Archivo de credenciales no encontrado en: {settings.GOOGLE_CALENDAR_CREDENTIALS_FILE}")
            return JsonResponse({
                'error': 'Archivo de credenciales no encontrado'
            }, status=500)

        flow = Flow.from_client_secrets_file(
            settings.GOOGLE_CALENDAR_CREDENTIALS_FILE,
            scopes=settings.GOOGLE_CALENDAR_SCOPES,
            redirect_uri=request.build_absolute_uri('/oauth2callback/')
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        request.session['state'] = state
        return redirect(authorization_url)
    except Exception as e:
        print(f"Error en google_auth: {str(e)}")
        return JsonResponse({
            'error': str(e)
        }, status=500)
#API PARA N8N
@api_view(['POST'])
def crear_paciente_api(request):
    """
    Endpoint para crear un nuevo paciente vía API
    """
    try:
        serializer = PacienteSerializer(data=request.data)
        if serializer.is_valid():
            # Verificar si ya existe un paciente con esta cédula
            cedula = serializer.validated_data.get('cedula')
            if Paciente.objects.filter(cedula=cedula).exists():
                return Response(
                    {'error': 'Ya existe un paciente con esta cédula'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Guardar el nuevo paciente
            serializer.save()
            return Response({
                'success': True,
                'message': 'Paciente creado exitosamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def obtener_paciente_api(request, cedula):
    try:
        paciente = Paciente.objects.get(cedula=cedula)
        data = {
            'success': True,
            'data': {
                'nombres': paciente.nombres,
                'apellidos': paciente.apellidos,
                'cedula': paciente.cedula,
                'fecha_nacimiento': paciente.fecha_nacimiento,
                'telefono': paciente.telefono,
                'direccion': paciente.direccion,
                'correo': paciente.correo,
                'sexo': paciente.sexo,
                'discapacidad': paciente.discapacidad,
                'orientacion_sexual': paciente.orientacion_sexual,
                'grupo_sanguineo': paciente.grupo_sanguineo
            }
        }
        return Response(data)
    except Paciente.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Paciente no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@login_required
def obtener_antecedentes(request, cedula):
    try:
        paciente = Paciente.objects.get(cedula=cedula)
        antecedentes = Antecedentes.objects.filter(paciente=paciente).first()
        
        if antecedentes:
            data = {
                # Alergias
                'alergia_alimentos': antecedentes.alergia_alimentos,
                'alergia_alimentos_detalle': antecedentes.alergia_alimentos_detalle,
                'alergia_medicamentos': antecedentes.alergia_medicamentos,
                'alergia_medicamentos_detalle': antecedentes.alergia_medicamentos_detalle,
                'alergia_otros': antecedentes.alergia_otros,
                'alergia_otros_detalle': antecedentes.alergia_otros_detalle,
                
                # Enfermedades Sistémicas
                'hemorragias': antecedentes.hemorragias,
                'hemorragias_detalle': antecedentes.hemorragias_detalle,
                'vih': antecedentes.vih,
                'tuberculosis': antecedentes.tuberculosis,
                'asma': antecedentes.asma,
                'diabetes': antecedentes.diabetes,
                'hipertension': antecedentes.hipertension,
                'enfermedad_cardiaca': antecedentes.enfermedad_cardiaca,
                'enfermedad_cardiaca_detalle': antecedentes.enfermedad_cardiaca_detalle,
                'otras_enfermedades': antecedentes.otras_enfermedades,
                'otras_enfermedades_detalle': antecedentes.otras_enfermedades_detalle,
                
                # Hábitos
                'tabaquismo': antecedentes.tabaquismo,
                'tabaquismo_detalle': antecedentes.tabaquismo_detalle,
                'alcoholismo': antecedentes.alcoholismo,
                'alcoholismo_detalle': antecedentes.alcoholismo_detalle,
                'dieta_alta_azucares': antecedentes.dieta_alta_azucares,
                
                # Hábitos de Higiene
                'cepillado': antecedentes.cepillado,
                'hilo_dental': antecedentes.hilo_dental,
                'enjuague': antecedentes.enjuague,
                
                'fecha_actualizacion': antecedentes.fecha_actualizacion.strftime('%Y-%m-%d %H:%M:%S') if antecedentes.fecha_actualizacion else None
            }
            return JsonResponse({'success': True, 'data': data})
        return JsonResponse({'success': True, 'data': None})
    except Paciente.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Paciente no encontrado'})
    except Exception as e:
        print(f"Error al obtener antecedentes: {str(e)}")  # Para debugging
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@csrf_exempt
def guardar_antecedentes(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            cedula = data.pop('cedula')  # Removemos la cédula del diccionario de datos
            paciente = Paciente.objects.get(cedula=cedula)
            
            antecedentes, created = Antecedentes.objects.get_or_create(paciente=paciente)
            
            # Lista de campos que esperamos actualizar
            campos_esperados = [
                'alergia_alimentos', 'alergia_alimentos_detalle',
                'alergia_medicamentos', 'alergia_medicamentos_detalle',
                'alergia_otros', 'alergia_otros_detalle',
                'hemorragias', 'hemorragias_detalle',  # Nuevo campo
                'vih', 'tuberculosis', 'asma',
                'diabetes', 'hipertension',
                'enfermedad_cardiaca', 'enfermedad_cardiaca_detalle',  # Nuevo campo
                'otras_enfermedades', 'otras_enfermedades_detalle',
                'tabaquismo', 'tabaquismo_detalle',
                'alcoholismo', 'alcoholismo_detalle',
                'dieta_alta_azucares',
                'cepillado', 'hilo_dental', 'enjuague'
            ]

            # Actualizar cada campo si está presente en los datos
            for campo in campos_esperados:
                if campo in data:
                    setattr(antecedentes, campo, data[campo])
            
            antecedentes.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Antecedentes guardados correctamente',
                'fecha_actualizacion': antecedentes.fecha_actualizacion.strftime('%Y-%m-%d %H:%M:%S')
            })
            
        except Paciente.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Paciente no encontrado'})
        except Exception as e:
            print(f"Error al guardar antecedentes: {str(e)}")  # Para debugging
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
@csrf_exempt
def guardar_motivo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            paciente = Paciente.objects.get(cedula=data['cedula'])
            
            motivo = MotivoConsulta.objects.create(
                paciente=paciente,
                motivo=data['motivo'],
                problema_actual=data['problema_actual']
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Motivo de consulta guardado correctamente'
            })
            
        except Paciente.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Paciente no encontrado'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

@login_required
def obtener_consultas(request, cedula):
    try:
        paciente = Paciente.objects.get(cedula=cedula)
        consultas = MotivoConsulta.objects.filter(paciente=paciente).order_by('-fecha_registro')
        
        data = [{
            'id': consulta.id,  # Agregar el ID
            'motivo': consulta.motivo,
            'problema_actual': consulta.problema_actual,
            'fecha_registro': consulta.fecha_registro.isoformat()
        } for consulta in consultas]
        
        return JsonResponse({'success': True, 'consultas': data})
    except Paciente.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Paciente no encontrado'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@csrf_exempt
def eliminar_consulta(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            consulta_id = data.get('consulta_id')
            
            # Buscar y eliminar la consulta
            consulta = MotivoConsulta.objects.get(id=consulta_id)
            consulta.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Consulta eliminada correctamente'
            })
            
        except MotivoConsulta.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Consulta no encontrada'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'error': 'Método no permitido'
    })
