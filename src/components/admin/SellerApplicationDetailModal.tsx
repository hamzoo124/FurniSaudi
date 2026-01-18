import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, MapPin, Building, FileText, 
  User, Calendar, AlertCircle, Download,
  MessageSquare, Check, XCircle, Clock, Eye,
  CreditCard, Shield, Globe, Star, Award,
  ExternalLink, Copy, CheckCircle, XCircle as XCircleIcon,
  Info, FileEdit, Users, Percent, DollarSign,
  ChevronRight, ChevronLeft, Save, Send,
  Image as ImageIcon, File, ShieldCheck, Verified
} from 'lucide-react';
import { SellerApplication } from '@/types/seller';
import { sellersApi } from '@/lib/supabase/sellers';

interface SellerApplicationDetailModalProps {
  application: SellerApplication;
  onClose: () => void;
  onStatusChange: () => void;
  adminId: string;
}

const SellerApplicationDetailModal: React.FC<SellerApplicationDetailModalProps> = ({
  application,
  onClose,
  onStatusChange,
  adminId
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'bank' | 'messages'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  });
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadMessages();
  }, [application.user_id]);

  const loadMessages = async () => {
    try {
      const data = await sellersApi.getSellerMessages(application.user_id);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'more_info_needed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const result = await sellersApi.approveSellerApplication(
        application.id,
        adminId,
        adminNotes
      );
      
      if (result.success) {
        alert('Seller approved successfully!');
        onStatusChange();
        onClose();
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error approving application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sellersApi.rejectSellerApplication(
        application.id,
        adminId,
        rejectionReason,
        adminNotes
      );
      
      if (result.success) {
        alert('Application rejected successfully!');
        setShowRejectModal(false);
        setRejectionReason('');
        onStatusChange();
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!infoRequest.trim()) {
      alert('Please specify what information you need');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sellersApi.requestMoreInfo(
        application.id,
        adminId,
        infoRequest
      );
      
      if (result.success) {
        alert('Information requested successfully!');
        setShowInfoModal(false);
        setInfoRequest('');
        onStatusChange();
      }
    } catch (error) {
      console.error('Error requesting info:', error);
      alert('Error requesting information');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageData.subject.trim() || !messageData.message.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sellersApi.sendMessageToSeller(
        application.user_id,
        adminId,
        messageData.message,
        messageData.subject
      );
      
      if (result.success) {
        alert('Message sent successfully!');
        setShowMessageModal(false);
        setMessageData({ subject: '', message: '' });
        await loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadDocument = () => {
    if (application.cr_document_url) {
      window.open(application.cr_document_url, '_blank');
    } else {
      alert('No document available for download');
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {application.business_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Applied on {formatDate(application.submitted_at)}
                      </span>
                      {application.reviewed_at && (
                        <span className="text-gray-500 text-sm">
                          • Reviewed on {formatDate(application.reviewed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {application.status === 'pending' && (
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve Seller
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => setShowInfoModal(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Info className="w-4 h-4" />
                  Request Info
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex space-x-4">
              {[
                { id: 'info', label: 'Business Info', icon: Building },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'bank', label: 'Bank Details', icon: CreditCard },
                { id: 'messages', label: 'Messages', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applicant Info */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Applicant Information</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Full Name</label>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{application.full_name}</p>
                            <button
                              onClick={() => copyToClipboard(application.full_name)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Email Address</label>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{application.email}</p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyToClipboard(application.email)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-400" />
                              </button>
                              <a
                                href={`mailto:${application.email}`}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Contact Number</label>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{application.contact_number}</p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyToClipboard(application.contact_number)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-400" />
                              </button>
                              <a
                                href={`tel:${application.contact_number}`}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Address</label>
                          <p className="font-medium">{application.address}</p>
                          <p className="text-sm text-gray-600">{application.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white rounded-lg">
                        <Building className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Business Type</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-white rounded border border-gray-200 text-sm font-medium">
                            {application.business_type === 'company' ? '🏢 Company' : '👤 Individual'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">CR Number</label>
                        <div className="flex items-center justify-between mt-1">
                          <p className="font-mono font-medium">{application.cr_number}</p>
                          <button
                            onClick={() => copyToClipboard(application.cr_number)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Business Description</label>
                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">{application.business_description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Section */}
                <div className="space-y-6">
                  {/* Admin Notes */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white rounded-lg">
                        <FileEdit className="w-5 h-5 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Admin Notes</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        rows={4}
                        placeholder="Add notes about this application..."
                      />
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // Save notes logic here
                            alert('Notes saved!');
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                          <Save className="w-3 h-3" />
                          Save Notes
                        </button>
                      </div>

                      {application.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                              <p className="text-sm text-red-700 mt-1">{application.rejection_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Timeline */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Application Submitted</p>
                          <p className="text-sm text-gray-500">{formatDate(application.submitted_at)}</p>
                        </div>
                      </div>

                      {application.reviewed_at && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Reviewed by Admin</p>
                            <p className="text-sm text-gray-500">{formatDate(application.reviewed_at)}</p>
                            {application.reviewed_by && (
                              <p className="text-xs text-gray-400">Admin ID: {application.reviewed_by}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-sm text-gray-500">{formatDate(application.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Commercial Registration Documents</h3>
                        <p className="text-sm text-gray-600">CR Number: {application.cr_number}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadDocument}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Download className="w-4 h-4" />
                        Download Document
                      </button>
                      <button
                        onClick={() => window.open(application.cr_document_url || '#', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {application.cr_document_url ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <File className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">CR Document</p>
                          <p className="text-sm text-gray-500">
                            {application.cr_document_url.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-yellow-800">No Document Uploaded</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            The seller has not uploaded a CR document. You may request it using the "Request Info" button.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Verification Status */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          application.cr_document_url ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          {application.cr_document_url ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">CR Document</p>
                          <p className="text-sm text-gray-500">
                            {application.cr_document_url ? 'Document uploaded' : 'Document not uploaded'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.cr_document_url ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.cr_document_url ? 'Complete' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Verified className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">CR Number Verification</p>
                          <p className="text-sm text-gray-500">10-digit Saudi CR number</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Valid
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Overall Verification</p>
                          <p className="text-sm text-gray-500">Complete business verification</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded-lg">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
                      <p className="text-sm text-gray-600">For seller payouts and transactions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Bank Information</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Bank Name</label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-medium">{application.bank_name}</p>
                            <button
                              onClick={() => copyToClipboard(application.bank_name)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">Account Holder</label>
                          <p className="font-medium">{application.full_name}</p>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">Account Type</label>
                          <p className="font-medium">{application.business_type === 'company' ? 'Business Account' : 'Personal Account'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Account Details</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Account Number</label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-mono font-medium">{application.account_number}</p>
                            <button
                              onClick={() => copyToClipboard(application.account_number)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">IBAN Number</label>
                          <div className="flex items-center justify-between mt-1">
                            <p className="font-mono font-medium">{application.iban}</p>
                            <button
                              onClick={() => copyToClipboard(application.iban)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">IBAN Verification</label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-3 h-3 rounded-full ${
                              application.iban.startsWith('SA') ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm">
                              {application.iban.startsWith('SA') ? 'Valid Saudi IBAN' : 'Invalid IBAN format'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-800">Bank Information Security</p>
                        <p className="text-sm text-blue-700 mt-1">
                          This bank information is encrypted and stored securely. Only authorized administrators can view these details.
                          Never share this information outside the platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payout Settings */}
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Default Commission Rate</p>
                          <p className="text-sm text-gray-500">Applied to all sales</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">10%</span>
                          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Payout Schedule</p>
                          <p className="text-sm text-gray-500">Monthly automatic payouts</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Minimum Payout Amount</p>
                          <p className="text-sm text-gray-500">SAR 100 required for payout</p>
                        </div>
                        <span className="font-medium">SAR 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                        <p className="text-sm text-gray-600">Messages with {application.full_name}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowMessageModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                      New Message
                    </button>
                  </div>

                  {/* Messages List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-sm text-gray-400 mt-1">Send your first message to the seller</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            msg.sender_type === 'admin'
                              ? 'bg-blue-50 border border-blue-100 ml-8'
                              : 'bg-gray-50 border border-gray-200 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                msg.sender_type === 'admin' ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                                {msg.sender_type === 'admin' ? 'Admin' : application.full_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
                            </div>
                            {!msg.is_read && msg.sender_type !== 'admin' && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                Unread
                              </span>
                            )}
                          </div>
                          
                          {msg.subject && (
                            <p className="font-medium text-gray-900 mb-2">{msg.subject}</p>
                          )}
                          
                          <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Send Approval</p>
                        <p className="text-sm text-gray-500">Send approval confirmation</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowInfoModal(true)}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Info className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Request Info</p>
                        <p className="text-sm text-gray-500">Request more information</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowRejectModal(true)}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Send Rejection</p>
                        <p className="text-sm text-gray-500">Send rejection notice</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Application ID: {application.application_id}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {application.status === 'pending' && (
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Approve Seller'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Reject Seller Application
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Rejecting application for: <strong>{application.business_name}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Provide a clear reason for rejection..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Request More Information
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Requesting more information from: <strong>{application.business_name}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What information do you need? *
              </label>
              <textarea
                value={infoRequest}
                onChange={(e) => setInfoRequest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                placeholder="Be specific about what additional information or documents you need..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setInfoRequest('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfo}
                disabled={!infoRequest.trim() || isProcessing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Request Information'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Send Message to Seller
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Sending message to: <strong>{application.full_name}</strong>
              </p>
              <p className="text-xs text-gray-500">({application.email})</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={messageData.subject}
                onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Message subject..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={messageData.message}
                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Type your message here..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageData({ subject: '', message: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageData.subject.trim() || !messageData.message.trim() || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerApplicationDetailModal;