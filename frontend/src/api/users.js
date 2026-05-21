import client from './client';

export const getTenants = () => client.get('/users/tenants');
export const createTenant = (data) => client.post('/users/tenants', data);
export const deleteTenant = (id) => client.delete(`/users/tenants/${id}`);
