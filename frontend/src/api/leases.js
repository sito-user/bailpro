import client from './client';

export const getLeases = (params) => client.get('/leases', { params });
export const getLease = (id) => client.get(`/leases/${id}`);
export const createLease = (data) => client.post('/leases', data);
export const updateLease = (id, data) => client.patch(`/leases/${id}`, data);
export const getLeasePayments = (id) => client.get(`/leases/${id}/payments`);
