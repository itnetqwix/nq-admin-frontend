// import axios from "axios";
const axios = require('axios');
const authConfig = require('src/configs/auth')
export const reports = async (payload) => {
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/report/get-all`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            }
        );
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const getAllSavedSessions = async (payload) => {
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/common/get-all-saved-sessions`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            }
        );
        return response.data;
    } catch (err) {
        throw err;
    }
}

export const deleteReports = async (payload) => {
    try {
        const response = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/report/delete-report/${payload.id}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            }
        );
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const deleteSavedSession = async (payload) => {
    try {
        const response = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/common/delete-saved-session/${payload.id}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
        return response.data;
    } catch (err) {
        throw err;
    }
};