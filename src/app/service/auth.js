import axios from "../lib/axios";

export const authService = {
    async register() {
        try {
            const response = await axios.post('/auth/register');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async login(username, password) {
        try {
            const response = await axios.post('/auth/login', { username, password });
            return response.data;
        } catch (error) {
            throw error;
        }
    },


};
