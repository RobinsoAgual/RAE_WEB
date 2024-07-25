const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors()); // Habilitar CORS

// Ruta para manejar el registro de usuario
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Error en el registro. Verifica los datos e intenta de nuevo.');
    }

    const filePath = path.join(__dirname, '..', 'json', 'users.json');
    let users = [];
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        users = JSON.parse(fileData);
    }

    const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    const newUser = { id: newId, name, email, password };
    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    res.send({ success: true, userId: newId, userName: name });
});

// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ success: false });
    }

    const filePath = path.join(__dirname, '..', 'json', 'users.json');
    if (!fs.existsSync(filePath)) {
        return res.status(500).json({ success: false });
    }

    const fileData = fs.readFileSync(filePath);
    const users = JSON.parse(fileData);

    const user = users.find(user => user.name === name && user.password === password);

    if (user) {
        res.json({ success: true, userId: user.id, userName: user.name });
    } else {
        res.json({ success: false });
    }
});

// Ruta para obtener el nombre del usuario por ID
app.get('/getUserName/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const filePath = path.join(__dirname, '..', 'json', 'users.json');

    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        const users = JSON.parse(fileData);
        const user = users.find(user => user.id === userId);

        if (user) {
            res.send(user.name);
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } else {
        res.status(500).send('Archivo de usuarios no encontrado');
    }
});

// Ruta para agregar un nuevo curso
app.post('/addCourse', (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ success: false });
    }

    const filePath = path.join(__dirname, '..', 'json', 'cursos.json');
    let courses = [];
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        courses = JSON.parse(fileData);
    }

    const newId = courses.length > 0 ? Math.max(...courses.map(course => course.id)) + 1 : 1;
    const newCourse = { id: newId, name, description };
    courses.push(newCourse);
    fs.writeFileSync(filePath, JSON.stringify(courses, null, 2));

    res.json({ success: true });
});

// Ruta para obtener todos los cursos
app.get('/courses', (req, res) => {
    const filePath = path.join(__dirname, '..', 'json', 'cursos.json');

    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        const courses = JSON.parse(fileData);
        res.json(courses);
    } else {
        res.status(500).send('Archivo de cursos no encontrado');
    }
});

// Ruta para manejar la inscripción de cursos
app.post('/enroll', (req, res) => {
    const { userName, courseIds } = req.body;

    if (!userName || !courseIds || !Array.isArray(courseIds)) {
        return res.status(400).json({ success: false });
    }

    const filePath = path.join(__dirname, '..', 'json', 'alumnos.json');
    let enrollments = [];
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        enrollments = JSON.parse(fileData);
    }

    courseIds.forEach(courseId => {
        enrollments.push({ userName, courseId });
    });
    fs.writeFileSync(filePath, JSON.stringify(enrollments, null, 2));

    res.json({ success: true });
});

// Ruta para obtener los cursos inscritos por un usuario
app.get('/my-courses', (req, res) => {
    const userName = req.query.userName;

    if (!userName) {
        return res.status(400).json({ success: false, message: 'Nombre de usuario no proporcionado.' });
    }

    const enrollmentsFilePath = path.join(__dirname, '..', 'json', 'alumnos.json');
    const coursesFilePath = path.join(__dirname, '..', 'json', 'cursos.json');

    if (fs.existsSync(enrollmentsFilePath) && fs.existsSync(coursesFilePath)) {
        const enrollmentsFileData = fs.readFileSync(enrollmentsFilePath);
        const coursesFileData = fs.readFileSync(coursesFilePath);

        const enrollments = JSON.parse(enrollmentsFileData);
        const courses = JSON.parse(coursesFileData);

        console.log(`Inscripciones encontradas: ${JSON.stringify(enrollments, null, 2)}`);
        console.log(`Cursos encontrados: ${JSON.stringify(courses, null, 2)}`);

        const userEnrollments = enrollments.filter(e => e.userName === userName);

        // Unir los datos de cursos con las inscripciones
        const userCourses = userEnrollments.map(enrollment => {
            const courseId = parseInt(enrollment.courseId, 10); // Convertir courseId a número
            return courses.find(course => course.id === courseId);
        }).filter(course => course !== undefined);

        console.log('Cursos de usuario:', userCourses); // Mensaje de depuración
        res.json(userCourses);
    } else {
        console.error('Archivos de inscripciones o cursos no encontrados.');
        res.status(500).json({ success: false, message: 'Archivos de datos no encontrados.' });
    }
});

// Ruta para obtener el reporte de inscritos por curso
app.get('/report', (req, res) => {
    const courseId = parseInt(req.query.courseId, 10);

    if (isNaN(courseId)) {
        return res.status(400).json({ success: false, message: 'ID de curso no válido.' });
    }

    const enrollmentsFilePath = path.join(__dirname, '..', 'json', 'alumnos.json');
    const usersFilePath = path.join(__dirname, '..', 'json', 'users.json');

    if (fs.existsSync(enrollmentsFilePath) && fs.existsSync(usersFilePath)) {
        const enrollmentsFileData = fs.readFileSync(enrollmentsFilePath);
        const usersFileData = fs.readFileSync(usersFilePath);

        const enrollments = JSON.parse(enrollmentsFileData);
        const users = JSON.parse(usersFileData);

        const userEnrollments = enrollments.filter(e => parseInt(e.courseId, 10) === courseId);

        const enrolledUsers = userEnrollments.map(enrollment => {
            return users.find(user => user.name === enrollment.userName);
        }).filter(user => user !== undefined);

        res.json(enrolledUsers);
    } else {
        console.error('Archivos de inscripciones o usuarios no encontrados.');
        res.status(500).json({ success: false, message: 'Archivos de datos no encontrados.' });
    }
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
