import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // JSON Server URL
});

// Добавляем функцию для получения фотографий
export const getPhotos = async () => {
  const response = await api.get('/photos');
  return response.data;
};

// Остальной код...
export const registerUser = (user) => api.post('/users', user);
export const loginUser = async (email, password) => {
  const { data: users } = await api.get('/users', { params: { email } });
  if (users.length === 0) {
    throw new Error('User not found');
  }
  const user = users[0];
  if (user.password !== password) {
    throw new Error('Invalid password');
  }
  return user;
};
