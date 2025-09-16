// src/utils/formatDate.js
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatShortDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ar-EG');
};