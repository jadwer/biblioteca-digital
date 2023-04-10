# e-library-PRO-C75

Solution for PRO-C75

## Datos de acceso:
Para acceder a este proyecto desde el Firebase configurado de base se requieren el siguiente acceso:

- Correo: prueba@correo.com
- Contraseña: contraseña

## Datos disponibles de Firebase/Firestore
Para poder realizar transacciones, se han cargado algunos datos:

### Libros disponibles:
1. BSC001

###Estudiantes disponibles:
1. STG03B01

## Estructura de configuración
Se ha utilizado Firebase/firestore con la siguiente estructura. Tener cuidado con los datos anidados.

Se proporciona la estructura utilizada para que se pueda agregar más contenido a la aplicación modificando el archivo `config.js`.

### books collection

```
BSC001 {
    book_details: map {
        book_author: string("J. K. Rowling"),
        book_id: string("BSC001"),
        book_name: string("H. P. y la piedra filosofal"),
        is_book_available: bool(false),
        pages: numeric(800),
        price: numeric(1200)
    }
}
```

### student collection

```
STG03B01 {
    number_of_books_issued: number(1),
    student_details: map {
        grade: number(3),
        rol: number(1),
        section: string("B"),
        student_id: string("STG03B01"),
        student_name:string("Juan Perez")
    }
}
```

### student collection

```
STG03B01 {
    book_id: string("BSC001"),
    book_name: string("H. P. y la piedra filosofal"),
    date: string(10 de abril de 2023, 11:29:38 UTC-6),
    student_id: string("STG03B01"),
    student_name: string("Juan Perez"),
    transaction_type: string("issue"),
}
```

# Change log
versión: abril - 2023

En esta versión se han realizado cambios debido a la incompatibilidad del SDK de Expo usando en este. Los cambios son los siguientes:

* Actualización a Firebase/Firestore Web Versión 9 {Modular}
* Actualización de react-navigation al uso de react-navigation/native con sus respectivos usos de `screenOptions`
* uso de funciones Async/Await en lugar de promises, como lo marca la documentación oficial de Firebase
---
## Nota importante:
Se ha actualizado la biblioteca `"expo-permissions"` a la versión `^14.1.1` ya que está explicado en el curso, sin embargo, no está recomendado seguir usándolo y se recomienda usar los permisos específicos como `expo-camera` ya que retirarán el uso del anterior.

## Recomendaciones
* Agregar un "loading" en la sección de búsqueda
* Agregar un "No hay documentos" o código de error si no se carga nada
* Agregar un "Carcando más transacciones" cuando se scrolee hasta el límite (10) con un mensaje de "cargando"