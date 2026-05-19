import client from './client';

export const getProperties = (params) => client.get('/properties', { params });
export const getProperty = (id) => client.get(`/properties/${id}`);
export const createProperty = (data) => client.post('/properties', data);
export const updateProperty = (id, data) => client.patch(`/properties/${id}`, data);
export const deleteProperty = (id) => client.delete(`/properties/${id}`);
