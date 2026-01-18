import React, { useState, useEffect } from 'react';
import { useSellers } from '@/hooks/useSellers';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const PendingApprovalsList: React.FC = () => {
  const { 
    pendingSellers, 
    fetchSellers, 
    approveSeller, 
    rejectSeller,
    loading,
    loadingAction 
  } = useSellers();
  
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers({ approval_status: 'pending' });
  }, [fetchSellers]);

  const handleApprove = async (sellerId: string) => {
    const result = await approveSeller(sellerId);
    if (result.success) {
      toast.success('Seller approved successfully');
      fetchSellers({ approval_status: 'pending' });
    } else {
      toast.error(result.error || 'Failed to approve seller');
    }
  };

  const handleReject = async (sellerId: string) => {
    const reason = rejectionReasons[sellerId]?.trim();
    if (!reason || reason.length < 5) {
      toast.error('Please provide a rejection reason (min 5 characters)');
      return;
    }

    const result = await rejectSeller(sellerId, reason);
    if (result.success) {
      toast.success('Seller rejected successfully');
      setShowRejectForm(null);
      setRejectionReasons(prev => ({ ...prev, [sellerId]: '' }));
      fetchSellers({ approval_status: 'pending' });
    } else {
      toast.error(result.error || 'Failed to reject seller');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && pendingSellers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (pendingSellers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
            <p className="text-gray-500">All seller applications have been reviewed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Seller Approvals</h2>
          <p className="text-gray-600 mt-1">
            {pendingSellers.length} application{pendingSellers.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Needs Review
        </Badge>
      </div>

      <div className="grid gap-6">
        {pendingSellers.map((seller) => (
          <Card key={seller.id} className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-500" />
                    {seller.business_name}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {seller.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {seller.phone || 'Not provided'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied {formatDate(seller.created_at)}
                    </span>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  Pending Review
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Business Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {seller.business_type}</p>
                      <p><span className="font-medium">CR Number:</span> {seller.tax_id || 'Not provided'}</p>
                      <p><span className="font-medium">City:</span> {seller.city || 'Not provided'}</p>
                      {seller.business_description && (
                        <p className="mt-2">
                          <span className="font-medium">Description:</span> {seller.business_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {showRejectForm === seller.id ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Rejection Reason</h4>
                      <textarea
                        value={rejectionReasons[seller.id] || ''}
                        onChange={(e) => setRejectionReasons(prev => ({
                          ...prev,
                          [seller.id]: e.target.value
                        }))}
                        placeholder="Please provide a detailed reason for rejection..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReject(seller.id)}
                          disabled={loadingAction}
                          variant="destructive"
                          size="sm"
                        >
                          {loadingAction ? 'Processing...' : 'Confirm Reject'}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRejectForm(null);
                            setRejectionReasons(prev => ({ ...prev, [seller.id]: '' }));
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Actions</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleApprove(seller.id)}
                          disabled={loadingAction}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Seller
                        </Button>
                        <Button
                          onClick={() => setShowRejectForm(seller.id)}
                          disabled={loadingAction || showRejectForm !== null}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Application
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Review all information carefully before making a decision.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovalsList;