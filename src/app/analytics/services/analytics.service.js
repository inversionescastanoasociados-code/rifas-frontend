import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://rifas-backend-production.up.railway.app';

export const getReporteRifa = async (rifaId, fechaInicio, fechaFin) => {
  const params = {};

  if (fechaInicio && fechaFin) {
    params.fechaInicio = fechaInicio;
    params.fechaFin = fechaFin;
  }

  const token = localStorage.getItem('token');

  const response = await axios.get(
    `${API_BASE_URL}/api/reportes/rifa/${rifaId}`,
    {
      params,
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {}
    }
  );

  return response.data;
};

export const getVentasGeneral = async (rifaId, fechaInicio, fechaFin, page = 1, limit = 50, filters = {}) => {
  const params = { page, limit };

  if (fechaInicio && fechaFin) {
    params.fechaInicio = fechaInicio;
    params.fechaFin = fechaFin;
  }

  const token = localStorage.getItem('token');

  const response = await axios.get(
    `${API_BASE_URL}/api/reportes/rifa/${rifaId}/ventas`,
    {
      params,
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {}
    }
  );

  return response.data;
};
