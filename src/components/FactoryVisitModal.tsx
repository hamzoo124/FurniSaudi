import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, MapPin, Phone, Mail, 
  Check, X, Camera, FileText, DollarSign, 
  ThumbsUp, ThumbsDown, AlertCircle, Clock as ClockIcon,
  Download, Send, Edit, Trash2, Eye, MessageCircle,
  ChevronLeft, ChevronRight, Star, Shield, Lock,
  Building, ArrowLeft, MoreVertical
} from 'lucide-react';

// Enhanced Types for Factory Visit System
interface FactoryVisit {
  id: string;
  customerId: string;
  sellerId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  address: string;
  notes: string;
  duration: number;
  visitors: number;
  purpose: string;
  specialRequirements: string;
  createdAt: string;
  updatedAt: string;
  customerConfirmed: boolean;
  beforePhotos: string[];
  afterPhotos: string[];
  visitCompleted: boolean;
  completionTime?: string;
  customerFeedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'seller';
}

interface VisitContract {
  id: string;
  visitId: string;
  sellerId: string;
  customerId: string;
  contractTerms: string;
  price: number;
  deposit: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled';
  contractStatus: 'draft' | 'sent' | 'reviewed' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  customerSignedAt?: string;
  sellerSignedAt?: string;
  customerComments?: string;
  sellerComments?: string;
  contractFile?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: 'visit_request' | 'visit_confirmation' | 'visit_cancellation' | 
        'contract_sent' | 'contract_accepted' | 'contract_rejected' |
        'payment_required' | 'visit_reminder' | 'feedback_request';
  title: string;
  message: string;
  relatedId: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Enhanced Data Service for Factory Visits
class FactoryVisitService {
  private static instance: FactoryVisitService;
  private visits: FactoryVisit[] = [];
  private contracts: VisitContract[] = [];
  private notifications: Notification[] = [];

  constructor() {
    this.loadFromStorage();
  }

  static getInstance(): FactoryVisitService {
    if (!FactoryVisitService.instance) {
      FactoryVisitService.instance = new FactoryVisitService();
    }
    return FactoryVisitService.instance;
  }

  private loadFromStorage() {
    const savedVisits = localStorage.getItem('factoryVisits');
    const savedContracts = localStorage.getItem('visitContracts');
    const savedNotifications = localStorage.getItem('visitNotifications');

    if (savedVisits) this.visits = JSON.parse(savedVisits);
    if (savedContracts) this.contracts = JSON.parse(savedContracts);
    if (savedNotifications) this.notifications = JSON.parse(savedNotifications);
  }

  private saveToStorage() {
    localStorage.setItem('factoryVisits', JSON.stringify(this.visits));
    localStorage.setItem('visitContracts', JSON.stringify(this.contracts));
    localStorage.setItem('visitNotifications', JSON.stringify(this.notifications));
  }

  // Visit Methods
  scheduleVisit(visit: Omit<FactoryVisit, 'id' | 'createdAt' | 'updatedAt'>): FactoryVisit {
    const newVisit: FactoryVisit = {
      ...visit,
      id: `visit_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerConfirmed: false,
      beforePhotos: [],
      afterPhotos: [],
      visitCompleted: false
    };

    this.visits.push(newVisit);

    // Create notification for seller
    this.addNotification({
      userId: visit.sellerId,
      type: 'visit_request',
      title: 'New Visit Request',
      message: `${visit.customerName} requested a factory visit for ${visit.productName}`,
      relatedId: newVisit.id,
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToStorage();
    return newVisit;
  }

  updateVisitStatus(visitId: string, status: FactoryVisit['status'], reason?: string, cancelledBy?: 'customer' | 'seller'): FactoryVisit | null {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit) {
      const oldStatus = visit.status;
      visit.status = status;
      visit.updatedAt = new Date().toISOString();

      if (status === 'cancelled' && reason) {
        visit.cancellationReason = reason;
        visit.cancelledBy = cancelledBy;
      }

      // Create appropriate notification
      let notificationType: Notification['type'] = 'visit_confirmation';
      let notificationTitle = '';
      let notificationMessage = '';

      if (status === 'confirmed' && oldStatus === 'pending') {
        notificationType = 'visit_confirmation';
        notificationTitle = 'Visit Confirmed';
        notificationMessage = `Your factory visit for ${visit.productName} has been confirmed`;
      } else if (status === 'cancelled') {
        notificationType = 'visit_cancellation';
        notificationTitle = 'Visit Cancelled';
        notificationMessage = `The factory visit for ${visit.productName} has been cancelled`;
      } else if (status === 'rejected') {
        notificationType = 'visit_cancellation';
        notificationTitle = 'Visit Rejected';
        notificationMessage = `Your factory visit request for ${visit.productName} was rejected`;
      }

      this.addNotification({
        userId: visit.customerId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedId: visitId,
        read: false,
        createdAt: new Date().toISOString()
      });

      this.saveToStorage();
      return visit;
    }
    return null;
  }

  confirmVisit(visitId: string): FactoryVisit | null {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit && visit.status === 'confirmed') {
      visit.customerConfirmed = true;
      visit.updatedAt = new Date().toISOString();

      this.addNotification({
        userId: visit.sellerId,
        type: 'visit_confirmation',
        title: 'Visit Confirmed by Customer',
        message: `${visit.customerName} confirmed the factory visit`,
        relatedId: visitId,
        read: false,
        createdAt: new Date().toISOString()
      });

      this.saveToStorage();
      return visit;
    }
    return null;
  }

  completeVisit(visitId: string, afterPhotos: string[]): FactoryVisit | null {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit) {
      visit.visitCompleted = true;
      visit.afterPhotos = afterPhotos;
      visit.completionTime = new Date().toISOString();
      visit.updatedAt = new Date().toISOString();

      // Request feedback
      this.addNotification({
        userId: visit.customerId,
        type: 'feedback_request',
        title: 'Visit Completed - Share Your Feedback',
        message: `How was your visit for ${visit.productName}? Share your experience`,
        relatedId: visitId,
        read: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      this.saveToStorage();
      return visit;
    }
    return null;
  }

  submitFeedback(visitId: string, rating: number, comment: string): FactoryVisit | null {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit) {
      visit.customerFeedback = {
        rating,
        comment,
        submittedAt: new Date().toISOString()
      };
      visit.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return visit;
    }
    return null;
  }

  // Contract Methods
  createContract(contract: Omit<VisitContract, 'id' | 'createdAt' | 'updatedAt'>): VisitContract {
    const newContract: VisitContract = {
      ...contract,
      id: `contract_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.contracts.push(newContract);

    this.addNotification({
      userId: contract.customerId,
      type: 'contract_sent',
      title: 'New Contract Available',
      message: `A contract has been sent for your factory visit`,
      relatedId: newContract.id,
      read: false,
      createdAt: new Date().toISOString()
    });

    this.saveToStorage();
    return newContract;
  }

  updateContractStatus(contractId: string, status: VisitContract['contractStatus'], comments?: string): VisitContract | null {
    const contract = this.contracts.find(c => c.id === contractId);
    if (contract) {
      contract.contractStatus = status;
      contract.updatedAt = new Date().toISOString();

      if (comments) {
        if (status === 'reviewed' || status === 'rejected') {
          contract.customerComments = comments;
        }
      }

      if (status === 'accepted') {
        contract.customerSignedAt = new Date().toISOString();
      }

      let notificationType: Notification['type'] = 'contract_accepted';
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'accepted':
          notificationType = 'contract_accepted';
          notificationTitle = 'Contract Accepted';
          notificationMessage = 'The contract has been accepted by the customer';
          break;
        case 'rejected':
          notificationType = 'contract_rejected';
          notificationTitle = 'Contract Rejected';
          notificationMessage = 'The contract has been rejected by the customer';
          break;
        case 'reviewed':
          notificationTitle = 'Contract Reviewed';
          notificationMessage = 'The customer has reviewed the contract';
          break;
      }

      this.addNotification({
        userId: contract.sellerId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        relatedId: contractId,
        read: false,
        createdAt: new Date().toISOString()
      });

      this.saveToStorage();
      return contract;
    }
    return null;
  }

  // Notification Methods
  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`
    };
    this.notifications.push(newNotification);
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  getUnreadNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId && !n.read);
  }

  // Get methods for different perspectives
  getCustomerVisits(customerId: string): FactoryVisit[] {
    return this.visits.filter(v => v.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSellerVisits(sellerId: string): FactoryVisit[] {
    return this.visits.filter(v => v.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getVisitContracts(visitId: string): VisitContract[] {
    return this.contracts.filter(c => c.visitId === visitId);
  }

  // 24-hour expiration check
  checkExpirations(): void {
    const now = new Date();
    this.visits.forEach(visit => {
      if (visit.status === 'confirmed' && !visit.customerConfirmed) {
        const visitTime = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`);
        const timeDiff = visitTime.getTime() - now.getTime();
        
        if (timeDiff < 0 && timeDiff > -24 * 60 * 60 * 1000) {
          // Visit time passed but within 24 hours - send reminder
          if (!this.notifications.some(n => 
            n.relatedId === visit.id && n.type === 'visit_reminder' && 
            new Date(n.createdAt).getTime() > now.getTime() - 60 * 60 * 1000 // Not sent in last hour
          )) {
            this.addNotification({
              userId: visit.customerId,
              type: 'visit_reminder',
              title: 'Visit Confirmation Required',
              message: `Please confirm your visit for ${visit.productName} within 24 hours`,
              relatedId: visit.id,
              read: false,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }
    });
    this.saveToStorage();
  }
}

// Visit Card Component
const VisitCard: React.FC<{
  visit: FactoryVisit;
  onConfirm: (visitId: string) => void;
  onCancel: (visitId: string, reason: string) => void;
  onViewContract: (visitId: string) => void;
  contracts: VisitContract[];
}> = ({ visit, onConfirm, onCancel, onViewContract, contracts }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const contract = contracts.find(c => c.visitId === visit.id);
  const visitDateTime = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`);
  const isToday = new Date().toDateString() === visitDateTime.toDateString();
  const requiresConfirmation = visit.status === 'confirmed' && !visit.customerConfirmed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{visit.productName}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
              {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
            </span>
            {requiresConfirmation && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Awaiting Your Confirmation
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{visitDateTime.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{visit.scheduledTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>{visit.visitors} visitors</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{visit.address}</span>
            </div>
          </div>

          {visit.purpose && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Purpose:</strong> {visit.purpose}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {contract && (
            <button
              onClick={() => onViewContract(visit.id)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>View Contract</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {requiresConfirmation && (
            <button
              onClick={() => onConfirm(visit.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Confirm Visit
            </button>
          )}
          
          {visit.status !== 'cancelled' && visit.status !== 'rejected' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Cancel Visit
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Visit</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for cancellation:</p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={3}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Keep Visit
              </button>
              <button
                onClick={() => {
                  onCancel(visit.id, cancelReason);
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={!cancelReason.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Past Visit Card Component
const PastVisitCard: React.FC<{
  visit: FactoryVisit;
  onSubmitFeedback: (visitId: string, rating: number, comment: string) => void;
  onViewDetails: () => void;
}> = ({ visit, onSubmitFeedback, onViewDetails }) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const visitDateTime = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitFeedback = () => {
    if (rating > 0 && comment.trim()) {
      onSubmitFeedback(visit.id, rating, comment);
      setShowFeedbackModal(false);
      setRating(0);
      setComment('');
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{visit.productName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{visitDateTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{visit.scheduledTime}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>{visit.visitors} visitors</span>
              </div>
            </div>

            {visit.cancellationReason && (
              <p className="text-sm text-red-600 mb-2">
                <strong>Cancellation Reason:</strong> {visit.cancellationReason}
              </p>
            )}

            {visit.customerFeedback && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < visit.customerFeedback!.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span>Rated {visit.customerFeedback.rating}/5</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details
          </button>

          {visit.status === 'completed' && !visit.customerFeedback && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Submit Feedback
            </button>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          visit={visit}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleSubmitFeedback}
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
        />
      )}
    </>
  );
};

// Contract Card Component
const ContractCard: React.FC<{
  contract: VisitContract;
  visit?: FactoryVisit;
  onAction: (contractId: string, action: 'accept' | 'reject', comments?: string) => void;
  onViewDetails: () => void;
}> = ({ contract, visit, onAction, onViewDetails }) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject'>('accept');
  const [comments, setComments] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAction = () => {
    onAction(contract.id, action, comments);
    setShowActionModal(false);
    setComments('');
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {visit?.productName || 'Factory Visit Contract'}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.contractStatus)}`}>
                {contract.contractStatus.charAt(0).toUpperCase() + contract.contractStatus.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>${contract.price}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>Deposit: ${contract.deposit}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(contract.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>{contract.paymentStatus}</span>
              </div>
            </div>

            {contract.customerComments && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>Your Comments:</strong> {contract.customerComments}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Contract Details
          </button>

          {(contract.contractStatus === 'sent' || contract.contractStatus === 'reviewed') && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setAction('reject');
                  setShowActionModal(true);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setAction('accept');
                  setShowActionModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Accept
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'accept' ? 'Accept Contract' : 'Reject Contract'}
            </h3>
            
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={action === 'accept' ? 'Add comments (optional)...' : 'Please provide reason for rejection...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={3}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  action === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'accept' ? 'Accept Contract' : 'Reject Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Feedback Modal Component
const FeedbackModal: React.FC<{
  visit: FactoryVisit;
  onClose: () => void;
  onSubmit: () => void;
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
}> = ({ visit, onClose, onSubmit, rating, setRating, comment, setComment }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Visit Feedback</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            How was your visit for <strong>{visit.productName}</strong>?
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="text-2xl focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with the factory visit..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={rating === 0 || !comment.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

// Visit Detail Modal Component
const VisitDetailModal: React.FC<{
  visit: FactoryVisit;
  contracts: VisitContract[];
  onClose: () => void;
  onAction: (contractId: string, action: 'accept' | 'reject', comments?: string) => void;
}> = ({ visit, contracts, onClose, onAction }) => {
  const visitDateTime = new Date(`${visit.scheduledDate}T${visit.scheduledTime}`);
  const contract = contracts[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Visit Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visit Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Visit Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Product</label>
                <p className="text-gray-900">{visit.productName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-gray-900 capitalize">{visit.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date & Time</label>
                <p className="text-gray-900">
                  {visitDateTime.toLocaleDateString()} at {visit.scheduledTime}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Visitors</label>
                <p className="text-gray-900">{visit.visitors} people</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Purpose</label>
                <p className="text-gray-900">{visit.purpose}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">{visit.address}</p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {visit.specialRequirements && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Special Requirements</h4>
              <p className="text-gray-600">{visit.specialRequirements}</p>
            </div>
          )}

          {/* Contract Information */}
          {contract && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">Price</label>
                    <p className="text-gray-900">${contract.price}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Deposit</label>
                    <p className="text-gray-900">${contract.deposit}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Status</label>
                    <p className="text-gray-900 capitalize">{contract.contractStatus}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Payment</label>
                    <p className="text-gray-900 capitalize">{contract.paymentStatus}</p>
                  </div>
                </div>
                {contract.contractTerms && (
                  <div className="mt-4">
                    <label className="font-medium text-gray-600">Terms</label>
                    <p className="text-gray-600 text-sm mt-1">{contract.contractTerms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Feedback */}
          {visit.customerFeedback && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Feedback</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < visit.customerFeedback!.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    Rated {visit.customerFeedback.rating}/5
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{visit.customerFeedback.comment}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Contract Modal Component
const ContractModal: React.FC<{
  contract?: VisitContract;
  visit: FactoryVisit;
  onClose: () => void;
  onAction: (contractId: string, action: 'accept' | 'reject', comments?: string) => void;
}> = ({ contract, visit, onClose, onAction }) => {
  const [action, setAction] = useState<'accept' | 'reject'>('accept');
  const [comments, setComments] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);

  const handleSubmitAction = () => {
    if (contract) {
      onAction(contract.id, action, comments);
      setShowActionModal(false);
      setComments('');
    }
  };

  if (!contract) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contract Available</h3>
            <p className="text-gray-600 mb-4">The seller hasn't sent a contract for this visit yet.</p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Visit Contract</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Contract Header */}
            <div className="text-center border-b border-gray-200 pb-6">
              <Building className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Factory Visit Agreement</h2>
              <p className="text-gray-600 mt-2">Between {visit.customerName} and Seller</p>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Visit Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Product:</strong> {visit.productName}</p>
                  <p><strong>Date:</strong> {new Date(visit.scheduledDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {visit.scheduledTime}</p>
                  <p><strong>Visitors:</strong> {visit.visitors}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Financial Terms</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total Price:</strong> ${contract.price}</p>
                  <p><strong>Deposit Required:</strong> ${contract.deposit}</p>
                  <p><strong>Payment Status:</strong> {contract.paymentStatus}</p>
                  <p><strong>Contract Status:</strong> {contract.contractStatus}</p>
                </div>
              </div>
            </div>

            {/* Contract Terms */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {contract.contractTerms || `This agreement outlines the terms for the factory visit scheduled between the customer and the seller. The deposit is required to secure the visit slot and will be applied towards the final payment. Both parties agree to adhere to the scheduled time and any special requirements discussed.`}
                </p>
              </div>
            </div>

            {/* Customer Comments */}
            {contract.customerComments && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Comments</h4>
                <p className="text-sm text-gray-600">{contract.customerComments}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(contract.contractStatus === 'sent' || contract.contractStatus === 'reviewed') && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setAction('reject');
                  setShowActionModal(true);
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Contract
              </button>
              <button
                onClick={() => {
                  setAction('accept');
                  setShowActionModal(true);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Accept Contract
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {action === 'accept' ? 'Accept Contract' : 'Reject Contract'}
            </h3>
            
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={action === 'accept' ? 'Add comments (optional)...' : 'Please provide reason for rejection...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              rows={3}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  action === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'accept' ? 'Accept Contract' : 'Reject Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main Customer Factory Visits Component
export const CustomerFactoryVisits: React.FC<{
  customerId: string;
  onNavigate: (page: string) => void;
}> = ({ customerId, onNavigate }) => {
  const [visits, setVisits] = useState<FactoryVisit[]>([]);
  const [contracts, setContracts] = useState<VisitContract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<FactoryVisit | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'contracts'>('upcoming');

  const visitService = FactoryVisitService.getInstance();

  useEffect(() => {
    loadData();
    // Check for expirations every minute
    const interval = setInterval(() => {
      visitService.checkExpirations();
      loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, [customerId]);

  const loadData = () => {
    const customerVisits = visitService.getCustomerVisits(customerId);
    const allContracts = customerVisits.flatMap(visit => 
      visitService.getVisitContracts(visit.id)
    );
    const unreadNotifications = visitService.getUnreadNotifications(customerId);

    setVisits(customerVisits);
    setContracts(allContracts);
    setNotifications(unreadNotifications);
  };

  const upcomingVisits = visits.filter(v => 
    ['pending', 'confirmed'].includes(v.status) && 
    new Date(v.scheduledDate) >= new Date()
  );

  const pastVisits = visits.filter(v => 
    v.status === 'completed' || 
    v.status === 'cancelled' || 
    v.status === 'rejected' ||
    new Date(v.scheduledDate) < new Date()
  );

  const handleConfirmVisit = (visitId: string) => {
    const updatedVisit = visitService.confirmVisit(visitId);
    if (updatedVisit) {
      setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
      loadData();
    }
  };

  const handleCancelVisit = (visitId: string, reason: string) => {
    const updatedVisit = visitService.updateVisitStatus(visitId, 'cancelled', reason, 'customer');
    if (updatedVisit) {
      setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
      loadData();
    }
  };

  const handleSubmitFeedback = (visitId: string, rating: number, comment: string) => {
    const updatedVisit = visitService.submitFeedback(visitId, rating, comment);
    if (updatedVisit) {
      setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
      setShowFeedbackModal(false);
      loadData();
    }
  };

  const handleContractAction = (contractId: string, action: 'accept' | 'reject', comments?: string) => {
    const status = action === 'accept' ? 'accepted' : 'rejected';
    const updatedContract = visitService.updateContractStatus(contractId, status, comments);
    if (updatedContract) {
      setContracts(prev => prev.map(c => c.id === contractId ? updatedContract : c));
      setShowContractModal(false);
      loadData();
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    visitService.markNotificationAsRead(notificationId);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Factory Visits</h1>
              <p className="text-gray-600 mt-2">Manage your scheduled factory visits and contracts</p>
            </div>
            <div className="flex items-center space-x-4">
              {notifications.length > 0 && (
                <div className="relative">
                  <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {notifications.length}
                  </div>
                </div>
              )}
              <button
                onClick={() => onNavigate('home')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule New Visit
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Visits</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingVisits.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {upcomingVisits.filter(v => v.status === 'confirmed' && !v.customerConfirmed).length}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.contractStatus === 'sent' || c.contractStatus === 'reviewed').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Feedback</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pastVisits.filter(v => v.visitCompleted && !v.customerFeedback).length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => markNotificationAsRead(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'upcoming' as const, name: 'Upcoming Visits', count: upcomingVisits.length },
                { id: 'past' as const, name: 'Past Visits', count: pastVisits.length },
                { id: 'contracts' as const, name: 'Contracts', count: contracts.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                {upcomingVisits.map(visit => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    onConfirm={handleConfirmVisit}
                    onCancel={handleCancelVisit}
                    onViewContract={(visitId) => {
                      const contract = contracts.find(c => c.visitId === visitId);
                      if (contract) {
                        setSelectedVisit(visit);
                        setShowContractModal(true);
                      }
                    }}
                    contracts={contracts}
                  />
                ))}
                {upcomingVisits.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Visits</h3>
                    <p className="text-gray-600 mb-4">Schedule your first factory visit to get started</p>
                    <button
                      onClick={() => onNavigate('home')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Schedule Visit
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div className="space-y-6">
                {pastVisits.map(visit => (
                  <PastVisitCard
                    key={visit.id}
                    visit={visit}
                    onSubmitFeedback={handleSubmitFeedback}
                    onViewDetails={() => {
                      setSelectedVisit(visit);
                      setShowVisitModal(true);
                    }}
                  />
                ))}
                {pastVisits.length === 0 && (
                  <div className="text-center py-12">
                    <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Past Visits</h3>
                    <p className="text-gray-600">Your completed and cancelled visits will appear here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-6">
                {contracts.map(contract => {
                  const visit = visits.find(v => v.id === contract.visitId);
                  return (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      visit={visit}
                      onAction={handleContractAction}
                      onViewDetails={() => {
                        setSelectedVisit(visit || null);
                        setShowContractModal(true);
                      }}
                    />
                  );
                })}
                {contracts.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contracts</h3>
                    <p className="text-gray-600">Contracts will appear here when sellers send them</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVisitModal && selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          contracts={contracts.filter(c => c.visitId === selectedVisit.id)}
          onClose={() => {
            setShowVisitModal(false);
            setSelectedVisit(null);
          }}
          onAction={handleContractAction}
        />
      )}

      {showContractModal && selectedVisit && (
        <ContractModal
          contract={contracts.find(c => c.visitId === selectedVisit.id)}
          visit={selectedVisit}
          onClose={() => {
            setShowContractModal(false);
            setSelectedVisit(null);
          }}
          onAction={handleContractAction}
        />
      )}
    </div>
  );
};

export default CustomerFactoryVisits;