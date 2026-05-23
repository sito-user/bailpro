import client from './client';

export const createPayment = (data) => client.post('/payments', data);
export const getPayment = (id) => client.get(`/payments/${id}`);
export const getDashboard = () => client.get('/dashboard/overview');
export const getMaintenance = () => client.get('/maintenance-requests');
export const createMaintenance = (data) => client.post('/maintenance-requests', data);
export const updateMaintenance = (id, data) => client.patch(`/maintenance-requests/${id}`, data);
