
import { Resource } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, Code, Link, FileCheck } from 'lucide-react';

interface ResourceMetricsProps {
  resources: Resource[];
}

const ResourceMetrics = ({ resources }: ResourceMetricsProps) => {
  const getResourceCounts = () => {
    const counts = {
      total: resources.length,
      document: 0,
      video: 0,
      assignment: 0,
    };
    
    resources.forEach(resource => {
      const fileName = resource.fileName?.toLowerCase() || '';
      const type = resource.type?.toLowerCase() || '';
      
      // Check if it's a video file by extension or type
      if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || 
          type === 'recording' || type === 'video') {
        counts.video++;
      } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
               fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileName.endsWith('.txt') || 
               type === 'assignment' || type === 'document') {
        counts.document++;
      } else {
        // Default to document for all other types
        counts.document++;
      }
    });
    
    return counts;
  };
  
  const resourceCounts = getResourceCounts();
  
  const metrics = [
    {
      title: 'Total Resources',
      value: resourceCounts.total,
      icon: <FileCheck className="h-5 w-5 text-primary" />,
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Assignments/Documents',
      value: resourceCounts.document,
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Class Recordings',
      value: resourceCounts.video,
      icon: <Video className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-100',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{metric.value}</span>
              <div className={`h-10 w-10 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                {metric.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ResourceMetrics;
