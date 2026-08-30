import React from 'react';

interface ButtonControlProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const ButtonControl: React.FC<ButtonControlProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2 px-3 rounded-md font-medium transition-colors duration-200 ${getVariantClasses()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
};

export default ButtonControl;