import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const ProductSearch = ({ value, onChange }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync local state with props
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Debounce search to avoid too many re-renders
    const handler = setTimeout(() => {
      onChange(newValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products..."
          className="pl-10 pr-10 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={handleChange}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
