/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

//! LOGIN ->
//~ Frist time when the user submit login page as a response from the server a cookie is send which browser send in each request to the server.
//@ After this server recieve and parse the cookie using cookie-parser npm package and then verfiy it using protect middleware function.
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

//! LOGOUT ->
//@ location.reload(true) this will send a fresh page to the client so that the browser dosent load the page from cache.
//~ Location reload() Method
//~ The reload() method does the same as the reload button in your browser. By default, the reload() method reloads the page from the cache, but you can force it to reload the page from the server by setting the forceGet parameter to true: location. reload(true).
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out. Try again later!');
  }
};
