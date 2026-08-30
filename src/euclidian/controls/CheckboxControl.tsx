import React from 'react';

interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckboxControl: React.FC<CheckboxControlProps> = ({
  label,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <label className="text-sm font-medium text-gray-700 cursor-pointer">
        {label}
      </label>
    </div>
  );
};

export default CheckboxControl;