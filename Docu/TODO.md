# Done
La duración estimada de una plantilla se debería calcular con la fecha de inicio y fin relativa de las tareas, no ser un campo que se inserta a mano.
En el listado de plantillas, debe haber una columna más que se "Total horas", que sume el total de horas previstas, y debemos quitar la columna "Descripción".

Permitir Duplicar una plantilla existente

Cada consultor debe tener una disponibilidad máxima semanal, que se establecerá en el perfil de dicho consultor.

Al editar un proyecto, se debe permitir editar las tareas

En la plantilla de proyecto, al mostrar el modo cronograma, no permitir que este desborde, sino que debería haber un scroll (manteniendo la columna de la izquierda con los nombres de las tareas y horas fija). 

El cronograma y la lista de tareas se deberían mostrar con esta exacta funcionalidad no solo en la plantilla de proyecto, sino también en la página de creación de proyecto y en la de edición de un proyecto (pero adaptado para mostrarse con las fechas reales, no las relativas)

Vamos a asignar roles a los usuarios, que además se tendrán que mapear con la tabla de consultores. Los roles que creo que vamos a tener son: Admin, Project Manager y Consultor

En la vista general de carga de trabajo, siempre se empezará a ver desde la semana actual, y siempre se mostrará como fecha de inicio de cada semana los lunes, no el día actual, así como la carga que se verá será la se cada semana completa de lunes a domingo. 

Añadir al dashboard un nuevo elemento que sea una tabla que muestre el nº de proyectos activos en los que está un consultor actualmente, el número de horas asignadas que tiene pendiente de ejecutar


# TO DO _____________________________________________________________________



Añadir una vista de diagrama de todos los proyectos (una línea por proyecto que abarque desde su fecha de inicio hasta la de fin) y que se pueda filtrar por campos como el tipo de proyecto o el consultor que participa)

En la pantalla de listado de proyectos, por defecto se deberían ocultar los proyectos completados, mostrando un toggle activado que sea "Ocultar finalizados" y que permita mostrarlos si se desmarca.


Ahora tenemos que implementar la funcionalidad para registrar tiempo real dedicado a la tarea. Esto solo lo podrá hacer un usuario con rol admin (que lo podrá hacer en cualquier tarea) o el propio usuario que haya iniciado sesión en sus tareas asignadas. Viendo mi aplicación, ¿cuál crees que es la forma más eficiente y cómoda para aplicarlo?
Tenemos que tener en cuenta que 
- una tarea puede no hacerse de una sola vez, por lo que un usuario podría llegar a imputar tiempos a una tarea varias veces, y la dedicación real a esa tarea será la suma de todos los registros que se le hayan hecho
- el tiempo registrado en una tarea puede llegar a ser superior al previsto.


El progreso del proyecto se debe calcular en base a los tiempos imputados en cada tarea (si una tarea tiene más horas imputadas que previstas, no se suma más de un 100% de la consecución de esa tarea)


## Gestión avanzada de la consultoría
Cada tarea tiene que permitir tener varias personas asignadas, y cada uno con unos tiempos/dedicación. Por ejemplo, la tarea "Entrevista Dirección General" puede requerir a un rol 3h y a otro 6 porque tiene que elaborar también una documentación. 

Las especializaciones de los consultores deben ser algo estructurado, una especie de tags que se puedan asignar una o varias a un mismo consultor, para luego poder filtrar en base a ellas. 
Habrá que crear en primer lugar un apartado para gestionar (crear, modificar, eliminar) las especializaciones, y luego la funcionalidad de elegir una o varias para un consultor. 
También se aplicarían a la hora de crear una tarea en una plantilla. ¿A nivel tarea o a nivel línea de la tarea para hacerlo con lo de que cada tarea pueda tener varias personas asignadas?

Necesitaremos roles para los consultores: 
- Consultor Estrategia Digital
- Consultor Especialista
Estos roles se utilizarán a la hora de crear una tarea en un proyecto, y también a la hora de crear una plantilla. 
Si una tarea de un proyecto ya tiene uno de estos roles pre-seleccionados, se deberá filtrar el selector de consultores con aquellos que cumplan el criterio. PAra esto hay que tener en cuenta que un consultor de Estrategia Digital puede actuar como consultor especialista (por tanto se mostrarán independientemente de los filtros), pero un especialista no puede actuar como consultor de estrategia, por lo que si el campo está seleccionado "Consultor Estrategia Digital", los especialistas no aparecerán. 
Lo mismo en el caso de las especializaciones, pudiendo combinarse entre ambos filtros (rol y especialicación. ). 



## Configuración guiada del proyecto 
Configurador de proyecto. Permite crear una configuración de un proyecto base en función de:
Áreas a Entrevistar
Perfiles para cada entrevista
Complejidad de la empresa

Tener en cuenta horas de desplazamientos en base a qué sesión es presencial y cuál no (esto debería ir en la tarea), el origen del consultor, y el lugar de la consultoría.

## Seguimiento de facturación y WIP