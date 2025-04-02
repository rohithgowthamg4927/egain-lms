
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getBatch, updateBatch } from '@/lib/api/batches';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BatchForm from '@/components/batches/BatchForm';

const EditBatch = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const batchQuery = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => getBatch(Number(batchId)),
    enabled: !!batchId,
  });

  const handleSubmit = async (formData: any) => {
    if (!batchId) return;
    
    setIsSubmitting(true);
    try {
      const response = await updateBatch(Number(batchId), formData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Batch updated successfully',
        });
        navigate(`/batches/${batchId}`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = batchQuery.isLoading;
  const isError = batchQuery.isError;
  const batch = batchQuery.data?.data;

  return (
    <div className="p-0">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/batches/${batchId}`)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batch
          </Button>
          <h1 className="text-3xl font-bold">Edit Batch</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading batch details...</p>
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-64">
          <p>Error loading batch details. Please try again later.</p>
        </div>
      ) : !batch ? (
        <div className="flex justify-center items-center h-64">
          <p>Batch not found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <BatchForm 
            batch={batch}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default EditBatch;
