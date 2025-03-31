
import { Batch } from '@/lib/types';
import BatchCard from './BatchCard';

interface BatchGridProps {
  batches: Batch[];
  loading?: boolean;
  onView?: (batch: Batch) => void;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batch: Batch) => void;
  onManageStudents?: (batch: Batch) => void;
}

const BatchGrid = ({ 
  batches, 
  loading = false, 
  onView, 
  onEdit, 
  onDelete,
  onManageStudents
}: BatchGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-card rounded-lg border shadow animate-pulse h-[280px]"
          />
        ))}
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No batches found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your filters or add a new batch.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {batches.map((batch) => (
        <BatchCard 
          key={batch.batchId} 
          batch={batch} 
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onManageStudents={onManageStudents}
        />
      ))}
    </div>
  );
};

export default BatchGrid;
