import Link from "next/link";
import { Users, Calendar, Edit, Trash2 } from "lucide-react";

interface BatchCardProps {
  batch: {
    _id: string;
    title: string;
    code: string;
    createdAt: string;
    updatedAt: string;
    studentCount?: number;
  };
  onDelete?: (batchId: string) => void;
  deletingBatch?: string | null;
  showActions?: boolean;
}

export default function BatchCard({ 
  batch, 
  onDelete, 
  deletingBatch, 
  showActions = true 
}: BatchCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-black">{batch.title}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {batch.code}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>{batch.studentCount || 0} students</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Created {formatDate(batch.createdAt)}</span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            <Link
              href={`/dashboard/admin/batches/${batch._id}`}
              className="p-2 text-gray-600 hover:text-black transition-colors"
              title="View/Edit Batch"
            >
              <Edit className="h-4 w-4" />
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(batch._id)}
                disabled={deletingBatch === batch._id}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete Batch"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href={`/dashboard/admin/batches/${batch._id}`}
            className="text-sm text-black hover:underline font-medium"
          >
            View Details →
          </Link>
        </div>
      )}
    </div>
  );
}
