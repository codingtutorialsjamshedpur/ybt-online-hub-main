import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { X } from 'lucide-react';

interface ProductFilterProps {
  categoryFilter: string;
  priceFilter: string;
  stockFilter: string;
  onFilterChange: (type: string, value: string) => void;
  hideCategories?: boolean;
}

const ProductFilter = ({
  categoryFilter,
  priceFilter,
  stockFilter,
  onFilterChange,
  hideCategories = false,
}: ProductFilterProps) => {
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Available categories
  const categories = [
    { value: 'E-Book', label: 'E-Books' },
    { value: 'PACK', label: 'Packs' },
    { value: 'Template', label: 'Templates' },
    { value: 'Tools/Scripts', label: 'Tools & Scripts' },
    { value: 'Video Course', label: 'Video Courses' },
  ];

  // Price range options
  const priceRanges = [
    { value: 'free', label: 'Free' },
    { value: 'under50', label: 'Under ₹50' },
    { value: 'over50', label: '₹50 and above' },
  ];

  // Check if any filters are active
  const hasActiveFilters = categoryFilter || priceFilter || stockFilter;

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange('category', '');
    onFilterChange('price', '');
    onFilterChange('stock', '');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          className={`${!hasActiveFilters ? 'invisible' : ''}`}
          onClick={clearAllFilters}
        >
          <X className="h-4 w-4 mr-1" /> Clear All
        </Button>
      </div>

      {/* Mobile filter toggle */}
      <Button
        variant="outline"
        className="w-full mb-4 lg:hidden"
        onClick={() => setFiltersVisible(!filtersVisible)}
      >
        {filtersVisible ? 'Hide Filters' : 'Show Filters'}
      </Button>

      <div className={`lg:block ${filtersVisible ? 'block' : 'hidden'}`}>
        <Accordion type="single" collapsible defaultValue="category">
          {/* Category filter */}
          {!hideCategories && (
            <AccordionItem value="category">
              <AccordionTrigger className="text-base font-medium py-2">
                Category
              </AccordionTrigger>
              <AccordionContent>
                <RadioGroup 
                  value={categoryFilter} 
                  onValueChange={(value) => onFilterChange('category', value)}
                  className="space-y-2"
                >
                  {categories.map((category) => (
                    <div key={category.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={category.value} id={`category-${category.value}`} />
                      <Label htmlFor={`category-${category.value}`} className="cursor-pointer text-sm">
                        {category.label}
                      </Label>
                    </div>
                  ))}
                  {categoryFilter && (
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onFilterChange('category', '')}
                      >
                        <X className="h-3 w-3 mr-1" /> Clear
                      </Button>
                    </div>
                  )}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Price Filter */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-base font-medium py-2">
              Price Range
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={priceFilter}
                onValueChange={(value) => onFilterChange('price', value)}
                className="space-y-2"
              >
                {priceRanges.map((price) => (
                  <div key={price.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={price.value} id={`price-${price.value}`} />
                    <Label
                      htmlFor={`price-${price.value}`}
                      className="cursor-pointer text-sm"
                    >
                      {price.label}
                    </Label>
                  </div>
                ))}
                {priceFilter && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onFilterChange('price', '')}
                    >
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Stock Filter */}
          <AccordionItem value="stock">
            <AccordionTrigger className="text-base font-medium py-2">
              Availability
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={stockFilter}
                onValueChange={(value) => onFilterChange('stock', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instock" id="stock-instock" />
                  <Label htmlFor="stock-instock" className="cursor-pointer text-sm">
                    In Stock Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="stock-all" />
                  <Label htmlFor="stock-all" className="cursor-pointer text-sm">
                    Show All
                  </Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {hasActiveFilters && (
          <div className="mt-5 pt-4 border-t">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {categoryFilter && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find((c) => c.value === categoryFilter)?.label}
                    <button
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      onClick={() => onFilterChange('category', '')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceFilter && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {priceRanges.find((p) => p.value === priceFilter)?.label}
                    <button
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      onClick={() => onFilterChange('price', '')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {stockFilter && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    In Stock Only
                    <button
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      onClick={() => onFilterChange('stock', '')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
