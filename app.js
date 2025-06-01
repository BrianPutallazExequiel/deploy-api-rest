const express = require('express');
const crypto = require('node:crypto');
const movies = require('./movies.json');
const z = require('zod');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.use(cors());

// Servir archivos estáticos desde la carpeta 'web'
app.use(express.static(path.join(__dirname, 'web')));

app.get('/', (req, res) => {
  res.json({ message: 'Hola Mundo' });
});

app.get('/movies', (req, res) => {
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(movie =>
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find(movie => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).json({ message: 'Movie not found' });
});

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body);
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  };
  movies.push(newMovie);
  // Persistencia básica (no ideal para Vercel, explicado más adelante)
  try {
    fs.writeFileSync('./movies.json', JSON.stringify(movies, null, 2));
  } catch (err) {
    console.error('Error al guardar movies.json:', err);
  }
  res.status(201).json(newMovie);
});

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body);
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  };
  movies[movieIndex] = updatedMovie;
  try {
    fs.writeFileSync('./movies.json', JSON.stringify(movies, null, 2));
  } catch (err) {
    console.error('Error al guardar movies.json:', err);
  }
  return res.json(updatedMovie);
});

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  movies.splice(movieIndex, 1);
  try {
    fs.writeFileSync('./movies.json', JSON.stringify(movies, null, 2));
  } catch (err) {
    console.error('Error al guardar movies.json:', err);
  }
  return res.json({ message: 'Movie deleted successfully' });
});

const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
});