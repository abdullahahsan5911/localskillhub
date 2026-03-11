import React from 'react';
import { Category } from '@/constants/categories';
import { Check } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showImage?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onClick,
  variant = 'default',
  showImage = false
}) => {
  const Icon = category.icon;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`relative border-2 rounded-xl p-4 transition-all duration-300 ${
          isSelected
            ? "border-blue-600 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="flex flex-col items-center text-center gap-2">
          {showImage && category.image ? (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 relative">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: category.lightColor }}>
                <Icon className="h-6 w-6" style={{ color: category.color }} />
              </div>
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isSelected ? "bg-blue-600" : ""
            }`} style={{ backgroundColor: isSelected ? category.color : category.lightColor }}>
              <Icon className={`h-6 w-6 ${
                isSelected ? "text-white" : ""
              }`} style={{ color: isSelected ? 'white' : category.color }} />
            </div>
          )}
          <span className={`text-sm font-medium ${
            isSelected ? "text-blue-900" : "text-gray-700"
          }`}>
            {category.name}
          </span>
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color }}>
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </button>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        className={`group border border-gray-200 rounded-xl p-6 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-500 ${
          isSelected ? 'border-blue-500 shadow-lg' : ''
        }`}
      >
        <div className="flex items-start gap-4">
          {showImage && category.image ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.lightColor }}>
                <Icon className="w-8 h-8" style={{ color: category.color }} />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: category.lightColor }}>
              <Icon className="w-8 h-8" style={{ color: category.color }} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600">{category.description}</p>
            )}
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: category.color }}>
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <button
      onClick={onClick}
      className={`relative border-2 rounded-xl p-6 transition-all duration-300 ${
        isSelected
          ? "border-blue-600 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {showImage && category.image ? (
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative">
            <img 
              src={category.image} 
              alt={category.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: category.lightColor }}>
              <Icon className="h-7 w-7" style={{ color: category.color }} />
            </div>
          </div>
        ) : (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isSelected ? "bg-blue-600" : ""
          }`} style={{ backgroundColor: isSelected ? category.color : category.lightColor }}>
            <Icon className={`h-7 w-7 ${
              isSelected ? "text-white" : ""
            }`} style={{ color: isSelected ? 'white' : category.color }} />
          </div>
        )}
        <span className={`text-sm font-medium ${
          isSelected ? "text-blue-900" : "text-gray-700"
        }`}>
          {category.name}
        </span>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: category.color }}>
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

export default CategoryCard;
