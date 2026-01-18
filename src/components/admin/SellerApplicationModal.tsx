import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  XCircle, 
  MessageSquare,
  FileText,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Download
} from 'lucide-react';
import { sellerManagementAPI, SellerApplication } from '@/api/sellerManagement';

interface SellerApplicationModalProps {
  application: SellerApplication;
  onClose: () => void;
  onStatusChange: () => void;
}

const SellerApplicationModal: React.FC<SellerApplicationModalProps> = ({
  application,
  onClose,
  onStatusChange
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [application.id]);

  const loadLogs = async () => {
    try {
      const logsData = await sellerManagementAPI.getApprovalLogs(application.application_id);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'more_info_needed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Seller Application Details</h2>
            <p className="text-sm text-gray-600">Application ID: {application.application_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Applicant Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Bar */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">
                      Submitted: {formatDate(application.submitted_at)}
                    </span>
                  </div>
                  {application.reviewed_at && (
                    <span className="text-sm text-gray-600">
                      Reviewed: {formatDate(application.reviewed_at)}
                    </span>
                  )}
                </div>
                
                {application.admin_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Admin Notes</p>
                        <p className="text-sm text-blue-700 mt-1">{application.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {application.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                        <p className="text-sm text-red-700 mt-1">{application.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Business Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-gray-900 font-medium">{application.business_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Type</label>
                    <p className="text-gray-900 capitalize">{application.business_type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">CR Number</label>
                    <p className="text-gray-900 font-mono">{application.cr_number}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <p className="text-gray-900">{application.city}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Business Description</label>
                  <p className="text-gray-900 mt-1">{application.business_description}</p>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <p className="text-gray-900 mt-1">{application.address}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 font-medium">{application.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{application.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{application.contact_number}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Bank Account Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bank Name</label>
                    <p className="text-gray-900">{application.bank_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Number</label>
                    <p className="text-gray-900 font-mono">{application.account_number}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">IBAN</label>
                    <p className="text-gray-900 font-mono">{application.iban}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Documents & Logs */}
            <div className="space-y-6">
              {/* Documents */}
              {application.cr_document_url && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">CR Document</p>
                          <p className="text-xs text-gray-500">Submitted for verification</p>
                        </div>
                      </div>
                      <a
                        href={application.cr_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Logs */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
                
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No activity logs yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border-l-2 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {log.action.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.profiles?.full_name || 'Admin'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        
                        {log.notes && (
                          <p className="text-sm text-gray-700 mt-2">{log.notes}</p>
                        )}
                        
                        {log.reason && (
                          <p className="text-sm text-red-600 mt-2">
                            <span className="font-medium">Reason:</span> {log.reason}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            From: {log.previous_status}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            To: {log.new_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Application ID: {application.application_id}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              
              {application.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      // You can trigger approval modal from here
                      onClose();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => {
                      // You can trigger rejection modal from here
                      onClose();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerApplicationModal;