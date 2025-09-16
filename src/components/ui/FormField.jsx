// src/components/ui/FormField.jsx
import React from 'react';

const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  options = [], 
  rows = 3,
  required = false,
  ...props 
}) => {
  const id = `form-field-${name}`;
  
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select 
            id={id} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className="form-control" 
            required={required}
            {...props}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea 
            id={id} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className="form-control" 
            rows={rows}
            required={required}
            {...props}
          />
        );
      default:
        return (
          <input 
            id={id} 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className="form-control" 
            required={required}
            {...props}
          />
        );
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};

export default FormField;