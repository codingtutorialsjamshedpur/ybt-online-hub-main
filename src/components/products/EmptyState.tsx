import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
  message?: string;
}

const EmptyState = ({ searchQuery, onClearFilters, message }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <SearchX className="h-16 w-16 text-gray-400" />
      </div>
      
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        😕 {message || 'No Products Found'}
      </h3>
      
      {searchQuery ? (
        <p className="text-gray-600 mb-6 max-w-md">
          We couldn't find any products matching <span className="font-medium">"{searchQuery}"</span>.
          Try adjusting your search or filters to find what you're looking for.
        </p>
      ) : (
        <p className="text-gray-600 mb-6 max-w-md">
          We couldn't find any products that match your current filter selections.
          Try changing your filters or check back later for new additions.
        </p>
      )}
      
      <Button 
        onClick={onClearFilters}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Clear All Filters
      </Button>
    </div>
  );
};

export default EmptyState;
